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

/// <reference path="../search/search_context.ts" />
/// <reference path="../search/search_parser.ts" />

namespace CodeWords.Search {
  import SearchContext = CodeWords.Search.SearchContext;
  import PendingParse = CodeWords.Search.PendingParse;

  export interface DelegationStackItem {
    parser: SearchParser;
    inputStart: number;
  }

  export interface DelegatingParse extends PendingParse {
    optSubcontext: DelegationSubcontext | undefined;
    delegationStack: DelegationStackItem[];
    delegatePendingParse: PendingParse | undefined;
    callback: ContinueParseCallback;
  }

  /**
   * A simple SearchParser that delegates results to other parsers, with
   * possible start offset. The call to the delegate will not include a prior
   * PendingParse. Following calls will occur directly, not through the delegate.
   *
   * @param delegate The parser for the substring.
   * @param substringStart The index of the character where the substring begins.
   * @param callback The callback to the parent parser, upon successful substring
   *                 parse.
   */
  export class DelegatingParser implements SearchParser {
    constructor(private tracer_?: SearchParserTracer) {
      if (tracer_) {
        tracer_.registerDelegatingParser(this);
      }
    }

    // TODO: Write docs
    newDelegateParse(context: SearchContext,
                     delegationStack: DelegationStackItem[],
                     optSubcontext: DelegationSubcontext | undefined,
                     callback: ContinueParseCallback): DelegatingParse {
      if (!delegationStack.length) {
        throw new Error('Empty delegation stack. No delegate defined.');
      }
      const {inputStart} = delegationStack[delegationStack.length - 1];
      return {
        parser: this,
        optSubcontext, delegationStack, callback,

        input: context.searchText,
        inputStart,
        inputEnd: inputStart,
        score: 0,
        delegatePendingParse: undefined,
        mayContinue: true,

        getExpression: () => undefined,
        getSnippet: () => undefined
      };
    }

    /**
     * Implements SearchParser by delegating a substring to another parser.
     *
     * @param context The context of the search text parsing.
     * @param parseStart The index of the character to begin the parse.
     * @param pendingParse Prior parse state.
     * @return A list of parses and potential parses.
     */
    attemptParse(context: SearchContext,
                 parseStart: number,
                 pendingParse: PendingParse | undefined): PendingParse[] {
      const delegationInfo = pendingParse as DelegatingParse;
      if (!delegationInfo ||
          !delegationInfo.delegationStack ||
          !delegationInfo.delegationStack[0]) {
        throw new Error('DelegatingParser requires delegate information in pendingParse');
      }
      const {
        delegationStack, optSubcontext, delegatePendingParse, callback
      } = delegationInfo;
      const {parser, inputStart} = delegationStack.slice(-1)[0];
      const subcontext = optSubcontext ? {...context, ...optSubcontext} : context;
      const delegateResults: PendingParse[] =
          parser.attemptParse(subcontext, inputStart, delegatePendingParse);
      if (this.tracer_) {
        this.tracer_.record({
          parser, inputStart,
          searchText: subcontext.searchText,
          outputs: delegateResults,
          delegationInfo,
          prevParse: delegationInfo.delegatePendingParse
        });
      }
      const finalResults: PendingParse[] = [];
      for (const delegateResult of delegateResults) {
        const expr = delegateResult.getExpression();
        if (expr) {
          const {inputStart} = delegationStack.slice(-1)[0];
          const parentContext = {
            ...context,
            delegationHistory: delegationStack.slice(0, -1),
          };
          finalResults.push(...callback(parentContext, inputStart, delegateResult));
        }
        if (delegateResult.mayContinue) {
          // Push an updated delegate parse.
          // This PendingParse will continue processing via the delegate,
          // but never return an expression or snippet directly.
          finalResults.push({
            parser: this,
            optSubcontext, delegationStack, callback,

            input: '',
            inputStart: parseStart,
            inputEnd: delegateResult.inputEnd,
            score: 0,
            delegatePendingParse: delegateResult,
            mayContinue: true,

            getExpression: () => undefined,
            getSnippet: () => undefined
          } as DelegatingParse);
        }
      }
      return finalResults;
    }

    toString() {
      return 'DelegatingParser';
    }
  }
}
