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

/// <reference path="../../../codewords_core/build/codewords_core.d.ts" />
/// <reference path="../javascript_code.ts" />
/// <reference path="../snippet/expression_snippet.ts" />
/// <reference path="../value/js_scope.ts" />

namespace CodeWordsJS.Search {
  import Expression = CodeWords.AST.Expression;
  import SearchContext = CodeWords.Search.SearchContext;
  import PendingParse = CodeWords.Search.PendingParse;
  import SearchParser = CodeWords.Search.SearchParser;
  import Snippet = CodeWords.Snippet.Snippet;

  import ExpressionSnippet = CodeWordsJS.Snippet.ExpressionSnippet;
  import JsScope = CodeWordsJS.Value.JsScope;
  import JavaScriptCode = CodeWordsJS.JavaScriptCode;
  import JsValueType = CodeWordsJS.Value.JsValueType;
  import IDENTIFIER_START_CHAR = CodeWordsJS.Value.IDENTIFIER_START_CHAR;

  // Magic Numbers // TODO: Test and verify rankings
  const IDENTIFIER_SCORE = 200;

  export enum IdentifierParseStateId {
    INITIAL_EMPTY_STRING = 0,
    IDENTIFIER_PENDING = 1,
    IDENTIFIER_BREAK = 2
  }

  /** The initial PendingCompletion. */
  export interface IdentifierInitialEmptyString {
    stateId: IdentifierParseStateId.INITIAL_EMPTY_STRING;
  }

  /** A PendingCompletion with one or more characters matching an identifier. */
  export interface IdentifierPending {
    stateId: IdentifierParseStateId.IDENTIFIER_PENDING;
    scope: JsScope;
    score: number;
    pendingIdentifier: string;
    pendingIdentifierStart: number;
    expr: Expression;
    valueType: JsValueType;
  }

  /**
   * A PendingCompletion where an identifier has been matched, but it
   * encountered a non-identifier character.
   */
  export interface IdentifierBreak {
    stateId: IdentifierParseStateId.IDENTIFIER_BREAK;
    scope: JsScope;
    score: number;
    expr: Expression;
    valueType: JsValueType;
  }

  /**
   * The full set of possible IdentifierPendingParse states, including
   * intermediate states.
   */
  export type IdentifierParseState =
      IdentifierInitialEmptyString | IdentifierPending | IdentifierBreak;

  export interface IdentifierPendingParse extends PendingParse {
    parser: IdentifierSearchParser;
    state: IdentifierParseState;
  }

  /**
   * SearchParser to traverse the members of a scope, including function member
   * with function calls.
   */
  export class IdentifierSearchParser implements SearchParser {
    toString() {
      return 'IdentifierSearchParser';
    }

    attemptParse(context: SearchContext,
                 parseStart: number,
                 prevPendingParse: PendingParse | undefined): IdentifierPendingParse[] {
      const prev = prevPendingParse as IdentifierPendingParse;
      if (CodeWords.Search.validateSearchParserArgs(this, context, parseStart, prev) &&
          prev.state === undefined) {
        throw new Error('Missing ScopedPendingParse.state');
      }

      const lang = context.astDoc!.language as JavaScriptCode;
      const input = context.searchText;
      const inputStart = parseStart;
      const length = input.length - inputStart;
      let n = prev ? prev.inputEnd - prev.inputStart : 0;

      // The current generation of ScopedPendingCompletions, starting with the prior
      // PendingParse result. Attempt to apply the next character to each
      // completion, thereby creating the next generation for the next character.
      let continuingStates: IdentifierParseState[] =
          prev && prev.state ? [prev.state] : [initialEmptyString_()];
      const resultStates: IdentifierParseState[] = [];

      for (; n < length; ++n) {
        const char = input[inputStart + n];  // TODO: Test codepoints instead of strings.
        const nextStates: IdentifierParseState[] = [];
        for (const completion of continuingStates) {
          const newCompletions: IdentifierParseState[] = [];
          switch (completion.stateId) {
            case IdentifierParseStateId.INITIAL_EMPTY_STRING: {
              if (n !== 0) {
                throw Error('Unexpected INITIAL_EMPTY_STRING when n===' + n);
              }
              newCompletions.push(
                  ...this.processInitialEmptyString_(
                      lang, context.scopes as JsScope[], completion, char));
              break;
            }

            case IdentifierParseStateId.IDENTIFIER_PENDING: {
              newCompletions.push(
                  ...this.processPendingIdentifier_(completion, n, char));
              break;
            }

            default:
              throw new Error('UNIMPLEMENTED state=' + completion.stateId);
          }
          for (const newCompletion of newCompletions) {
            if (newCompletion.stateId === IdentifierParseStateId.IDENTIFIER_BREAK) {
              resultStates.push(newCompletion);
            } else {
              nextStates.push(newCompletion);
            }
          }
        }

        continuingStates = nextStates;
      }
      resultStates.push(...continuingStates);

      const inputEnd = inputStart + n;
      const pendingParses = [] as IdentifierPendingParse[];
      for (const state of resultStates) {
        switch (state.stateId) {
          case IdentifierParseStateId.IDENTIFIER_PENDING:
          case IdentifierParseStateId.IDENTIFIER_BREAK: {
            const mayContinue =
                state.stateId === IdentifierParseStateId.IDENTIFIER_PENDING ||
                state.valueType.hasMembers();
            const {score} = state;
            pendingParses.push({
              parser: this,
              input, inputStart, inputEnd,
              state, mayContinue, score,
              getExpression: () => state.expr,
              getSnippet: buildGetSnippetFn_(state)
            });
            break;
          }

          default:
            console.error(
                `UNIMPLEMENTED: ${IdentifierParseStateId[state.stateId]} => PendingParse`);
        }
      }
      return pendingParses;
    }

    private processInitialEmptyString_(lang: JavaScriptCode,
                                       scopes: JsScope[],
                                       state: IdentifierInitialEmptyString,
                                       char: string)
    : IdentifierParseState[] {
      const resultStates: IdentifierParseState[] = [];
      // Find all identifiers that start with the character.
      if (IDENTIFIER_START_CHAR.test(char)) {
        for (const scope of scopes) {
          for (const member of scope.getMembersByPrefix(char)) {
            if (member.isIdentifier) {
              const {name, valueType} = member;
              const expr = lang.identifier(name, valueType);
              if (valueType.isNamespace()) {
                // TODO: Populate by recursing on namespace members.
              } else {
                if (name.length === 1) {
                  resultStates.push({
                    stateId: IdentifierParseStateId.IDENTIFIER_BREAK,
                    scope, expr, valueType,
                    score: incrementScoreForIdentifier_(state, name),
                  });
                } else {
                  resultStates.push({
                    stateId: IdentifierParseStateId.IDENTIFIER_PENDING,
                    pendingIdentifier: name,
                    pendingIdentifierStart: 0,
                    scope, expr, valueType,
                    score: incrementScoreForIdentifier_(state, name),
                  });
                }
              }
              if (valueType.isConstructor()) {
                // TODO: If not delegate parse, Generate snippets for popular
                // properties of the return type that match context's value
                // type filter.
              }
            }
          }
        }
      }
      return resultStates;
    }  // end processInitialEmptyString_(..)

    private processPendingIdentifier_(prevState: IdentifierPending,
                                      n: number,
                                      char: string): IdentifierParseState[] {
      const resultStates: IdentifierParseState[] = [];
      const {pendingIdentifier, pendingIdentifierStart, scope, expr, valueType} = prevState;
      const nthCharOfId = n - pendingIdentifierStart;
      if (nthCharOfId < pendingIdentifier.length) {
        // Attempt to match the remaining identifier characters.
        if (char.toLowerCase() === pendingIdentifier[nthCharOfId].toLowerCase()) {
          const score = incrementScoreForIdentifier_(prevState, pendingIdentifier);
          if (nthCharOfId + 1 === pendingIdentifier.length) {
            resultStates.push({
              stateId: IdentifierParseStateId.IDENTIFIER_BREAK,
              scope, score, expr, valueType,
            });
          } else {
            resultStates.push({...prevState, score});
          }
        }
      }
      return resultStates;
    }  // end of processIdentifierCompletion_(..)
  }

  /** @return A new ScopedPendingCompletion for use with INITIAL_EMPTY_STRING. */
  function initialEmptyString_(): IdentifierInitialEmptyString {
    return {
      stateId: IdentifierParseStateId.INITIAL_EMPTY_STRING
    };
  }

  function buildGetSnippetFn_(state: IdentifierPending | IdentifierBreak)
  : () => Snippet | undefined {
    const type = state.expr.getValueType() as JsValueType;
    // TODO: return undefined if state JsValueType is NAMESPACE
    return () => new ExpressionSnippet(state.expr, state.score);
  }

  function incrementScoreForIdentifier_(prevState: IdentifierParseState, idName: string)
  : number {
    const prevScore = (prevState.stateId === IdentifierParseStateId.INITIAL_EMPTY_STRING) ? 0 :
        prevState.score;
    return prevScore + IDENTIFIER_SCORE / idName.length;
  }
}
