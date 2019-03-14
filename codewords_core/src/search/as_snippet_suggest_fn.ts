// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/// <reference path="../ast/ast_document.ts" />
/// <reference path="../ast/value_type.ts" />
/// <reference path="../snippet/snippet.ts" />
/// <reference path="../snippet/snippet_context.ts" />
/// <reference path="../snippet/suggest_fn.ts" />

namespace CodeWords.Search {
  import SearchContext = CodeWords.Search.SearchContext;
  import Snippet = CodeWords.Snippet.Snippet;
  import SnippetContext = CodeWords.Snippet.SnippetContext;
  import SuggestFn = CodeWords.Snippet.SuggestFn;
  import PendingParse = CodeWords.Search.PendingParse;
  import scopesForLines = CodeWords.Render.scopesForLines;


  const LOG_PARSE_TRACES = false;  // TODO: Make this a run-time flag
  const LOG_GENERATED_SUGGEST_FN = false;
  // tslint:disable-next-line no-any
  function developerLog_(message?: any, ...optionalParams: any[]) {
    if (LOG_GENERATED_SUGGEST_FN) {
      console.log(message, ...optionalParams);
    }
  }

  /**
   * Conversion function from SearchParsers to a single Snippet SuggestFn for
   * use during the transition of the search APIs.
   *
   * @param searchParsers The SearchParsers to wrap.
   * @return A suggestion function that manages state between iterations for the SearchParser.
   */
  export function asSnippetSuggestFn(searchParsers: SearchParser[]): SuggestFn {
    if (!Array.isArray(searchParsers) ||
        searchParsers.filter((parser) => !parser.attemptParse).length) {
      // Log the raw searchParsers object to console.
      console.error('Expected array of SearchParser. Found ', searchParsers);
      throw new Error('Expected array of SearchParser. Found ' + searchParsers);
    }

    const tracer_ = new SearchParserTracer();

    const delegatingParser = new DelegatingParser(tracer_);

    // Persistent state information for the SuggestFn
    let prevSearchTextTrimmed = '';
    let pendingParses: PendingParse[] = [];

    /**
     * Delegation function for this set of SearchParsers.
     *
     * @param parentContext The SearchContext of the originating parse.
     * @param parentParser The parser that initiated this delegation.
     * @param parentStart The character index where the parent parser started.
     * @param optSubcontext Optional constraints on the resulting subparse.
     * @param substringStart The index of the character of searchText to begin
     *                       the subparse.
     * @param callback The callback to call when the delegate parser has
     *                 successfully matched a substring.
     * @return The PendingParses from the subparse. May include any mix of
     *         incomplete subparses, completed subparses, and continued parses.
     *         Should be returned by the calling attemptParse(..).
     * @private
     */
    function delegateSubParse_(parentContext: SearchContext,
                               parentDelegationStack: DelegationStackItem[],
                               delegationStart: number,
                               optSubcontext: DelegationSubcontext | undefined,
                               callback: ContinueParseCallback)
    : PendingParse[] {
      let pendingParses: PendingParse[] = [];

      const parentStackItem = parentDelegationStack[parentDelegationStack.length - 1];
      const parent = parentStackItem.parser;
      if (LOG_GENERATED_SUGGEST_FN) {
        developerLog_(`${parent} is requesting delegation starting from ${delegationStart}.`);
      }


      let onParsedCallback = callback;
      if (optSubcontext) {
        // Validate resulting parse before calling the callback.
        onParsedCallback = (searchContext: SearchContext,
                            inputStart: number,
                            parse: PendingParse) => {
          const expr = parse.getExpression();
          let isAllowed = true;

          if (isAllowed && optSubcontext.isExpressionTypeAllowed) {
            isAllowed = !!expr && optSubcontext.isExpressionTypeAllowed(expr.type);
          }
          if (isAllowed && optSubcontext.isValueTypeAllowed) {
            isAllowed = !!expr && optSubcontext.isValueTypeAllowed(expr.getValueType());
          }

          if (isAllowed) {
            // TODO: Calculate the resulting inputEnd
            return callback(searchContext, inputStart, parse);
          }
          return [];
        };
      }

      // Never recurse the same parser at the same location
      const applicableParsers = searchParsers.filter((parser) => {
        for (const item of parentDelegationStack) {
          if((item.parser === parser) && (item.inputStart === delegationStart)) {
            return false;
          }
        }
        return true;
      });
      for (const parser of applicableParsers) {
        const futureDelegationHistory =
            [...parentDelegationStack, {parser, inputStart:delegationStart}];
        pendingParses.push(
            delegatingParser.newDelegateParse(
                parentContext, futureDelegationHistory, optSubcontext, onParsedCallback));
      }

      if (delegationStart < parentContext.searchText.length) {
        // Attempt to process remaining input now.

        const newParses: PendingParse[] = [];

        for (const parse of pendingParses) {
          const newSearchContext: SearchContext = {
            ...parentContext,
            delegateSubParse: (subcontext, substringStart, callback) =>
                delegateSubParse_(
                    newSearchContext,
                    (parse as DelegatingParse).delegationStack,
                    substringStart,
                    subcontext,
                    callback)
          };
          newParses.push(
              ...delegatingParser.attemptParse(newSearchContext, delegationStart, parse));
        }
        pendingParses = newParses;
      }
      return pendingParses;
    }

    function buildInitialParseStates(snippetContext: SnippetContext, searchText: string)
    : PendingParse[] {
      tracer_.clear();

      const astDoc = snippetContext.astDoc;
      const visibleLines = snippetContext.renderedLines;  // TODO: Limit to visible
      const scopes = scopesForLines(visibleLines);

      const parseStates: PendingParse[] = [];
      for (const parser of searchParsers) {
        const inputStart = 0;
        try {
          const delegationStack = [{parser, inputStart: 0}];
          const searchContext: SearchContext = {
            astDoc, visibleLines, scopes, searchText,
            delegateSubParse: (optSubcontext, substringStart, callback) =>
                delegateSubParse_(
                    searchContext, delegationStack, substringStart, optSubcontext, callback)
          };

          const pendingParses = parser.attemptParse(searchContext, inputStart, undefined);
          tracer_.record({
            parser, searchText, inputStart, outputs: pendingParses
          });
          for (const parse of pendingParses) {
            // Only include root parses that process the entire input.
            if (parse.inputEnd === searchText.length) {
              parseStates.push(parse);
            }
          }
        } catch(error) {
          tracer_.record({
            parser, searchText, inputStart, error
          });
          console.error(`Error parsing '${searchText}' with ${parser}:`, error);
        }
      }

      if (LOG_PARSE_TRACES) {
        tracer_.logToConsole(searchText);
      }

      return parseStates;
    }

    function continueFromPendingParses(snippetContext: SnippetContext, searchText: string)
    : PendingParse[] {
      const astDoc = snippetContext.astDoc;
      const visibleLines = snippetContext.renderedLines;  // TODO: Calculate visible range.

      return pendingParses.reduce((newParses, prevParse) => {
        if (prevParse.mayContinue) {
          const parser = prevParse.parser;
          const inputStart = 0;
          try {
            const scopes = scopesForLines(visibleLines);
            const nextStackItem = {parser, inputStart};
            const prevStack = (prevParse as DelegatingParse).delegationStack;
            const futureDelegationHistory =
                prevStack ? [...prevStack, nextStackItem] : [nextStackItem];
            const searchContext: SearchContext = {
              astDoc, visibleLines, scopes, searchText,
              delegateSubParse: (optSubcontext, substringStart, callback) =>
                  delegateSubParse_(
                      searchContext, futureDelegationHistory, substringStart, optSubcontext, callback)
            };

            const pendingParses = parser.attemptParse(searchContext, inputStart, prevParse);
            tracer_.record({
              parser, searchText, inputStart, prevParse, outputs: pendingParses
            });
            for (const parse of pendingParses) {
              // Only include root parses that process the entire input.
              if (parse.inputEnd === searchText.length) {
                newParses.push(parse);
              }
            }
          } catch (error) {
            tracer_.record({
              parser, searchText, inputStart, error
            });
            console.error(`Error parsing '${searchText}' with ${parser}:`, error);
          }
        }
        return newParses;
      }, [] as PendingParse[]);
    }

    // Return a Snippet SuggestFn that can traverse all the provided SearchParsers.
    return (snippetContext: SnippetContext, ) => {
      developerLog_('entering generated SuggestFn.');

      const newTrimmedInput = snippetContext.searchText.trim();

      if (newTrimmedInput.length === 0) {
        prevSearchTextTrimmed = newTrimmedInput;
        pendingParses = [];
        developerLog_('returning from SuggestFn. empty input');
        return [];
      }
      developerLog_(`  newTrimmedInput = '${newTrimmedInput}`);

      try {
        tracer_.clear();
        if (prevSearchTextTrimmed.length &&
            newTrimmedInput.indexOf(prevSearchTextTrimmed) === 0) {
          developerLog_('  continuing at ' + prevSearchTextTrimmed.length);

          // Continuing from recursiveParseStates.
          pendingParses = continueFromPendingParses(snippetContext, newTrimmedInput);
        } else {
          // TODO: Wrap this in a function that can be reused during recursion
          // Start from scratch on each pending parser.
          pendingParses = buildInitialParseStates(snippetContext, newTrimmedInput);
        }
        if (LOG_PARSE_TRACES) {
          tracer_.logToConsole(newTrimmedInput);
          console.log('# PendingParses: ' + pendingParses.length);
        }

        // Only include snippets if the parse included all the input characters.
        const targetLen = newTrimmedInput.length;
        pendingParses = pendingParses.filter((prevParse) => (prevParse.inputEnd === targetLen));

        prevSearchTextTrimmed = newTrimmedInput;

        const snippets = pendingParses.reduce((accumulatedSnippets, prevParse) => {
          const maybeSnippet = prevParse.getSnippet();
          if (maybeSnippet) {
            accumulatedSnippets.push(maybeSnippet);
          }
          return accumulatedSnippets;
        }, [] as Snippet[]);
        developerLog_('returning from SuggestFn. snippets:\n', snippets);
        return snippets;
      } catch(err) {
        console.error(err);

        // Reset state.
        prevSearchTextTrimmed = '';
        pendingParses = [];
        return [];
      }
    };
  }
}
