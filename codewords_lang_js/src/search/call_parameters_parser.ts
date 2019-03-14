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
/// <reference path="../expression/build_function_call_completions.ts" />
/// <reference path="../expression/js_expression_types.ts" />
/// <reference path="../value/js_function_spec.ts" />

namespace CodeWordsJS.Search {
  import Expression = CodeWords.AST.Expression;
  import ExpressionType = CodeWords.AST.ExpressionType;
  import ValueType = CodeWords.AST.ValueType;
  import buildCallParameterCompletions = CodeWordsJS.Search.buildCallParameterCompletions;
  import PendingParse = CodeWords.Search.PendingParse;
  import SearchContext = CodeWords.Search.SearchContext;
  import SearchParser = CodeWords.Search.SearchParser;

  import CALL_PARAMETERS = CodeWordsJS.CALL_PARAMETERS;
  import JavaScriptCode = CodeWordsJS.JavaScriptCode;
  import JsFunctionSpec = CodeWordsJS.Value.JsFunctionSpec;

  const PUNCTUATION_BONUS = 10;

  export enum CallArgumentsStateId {
    INITIAL_EMPTY_STRING = 0,
    PENDING_DELIMITER = 1,
    PENDING_VALUE = 2,
    PENDING_END = 3
  }

  export interface CallParametersCompletion {
    state: CallArgumentsStateId;
    paramExprs: Expression[];
    score: number;

    expr?: Expression;
    autoCompletions?: Expression[];
    done?: boolean;
  }

  export interface CallParametersPendingParse extends PendingParse {
    fnSpec: JsFunctionSpec;
    completion: CallParametersCompletion;
  }

  /**
   * This SearchParser handles the parameters of a function or constructor,
   * including parsing any surrounding parenthesis.
   */
  export class CallParametersParser implements SearchParser {
    /** @see SearchParser.attemptParse */
    attemptParse(context: SearchContext,
                 parseStart: number,
                 prevPendingParse: PendingParse | undefined): PendingParse[] {
      const prev = prevPendingParse as CallParametersPendingParse;
      CodeWords.Search.validateSearchParserArgs(this, context, parseStart, prev);
      if (context.isExpressionTypeAllowed && !context.isExpressionTypeAllowed(CALL_PARAMETERS)) {
        return [];
      }
      const fnSpec = (prev && prev.fnSpec) || (context as JsSearchContext).fnSpec;
      if (!fnSpec) {
        return [];
      }

      const lang = context.astDoc!.language as JavaScriptCode;
      const input = context.searchText;
      const inputStart = parseStart;
      const length = input.length - inputStart;
      let n = prev ? prev.inputEnd - prev.inputStart : 0;

      // The current generation of CallParametersCompletions, starting with
      // the prior PendingParse result. Attempt to apply the next character to
      // each completion, thereby creating the next generation for the next
      // character.
      let completions: CallParametersCompletion[] =
          [(prev && prev.completion) || this.initialEmptyString_(lang, fnSpec)];
      const pendingParses: PendingParse[] = [];

      for (; n < length; ++n) {
        const char = input[inputStart + n];  // TODO: Test codepoints instead of strings.
        const nextGenCompletions: CallParametersCompletion[] = [];
        for (const completion of completions) {
          switch (completion.state) {
            case CallArgumentsStateId.INITIAL_EMPTY_STRING:
              nextGenCompletions.push(
                  ...this.processEmptyString_(lang, context, completion, fnSpec, char));
              break;

            case CallArgumentsStateId.PENDING_DELIMITER:
            case CallArgumentsStateId.PENDING_VALUE:
              nextGenCompletions.push(
                  ...this.processPendingValueOrDelimiter_(
                      lang, context, prev, fnSpec, completion, char, n, pendingParses));
              break;

            case CallArgumentsStateId.PENDING_END:
              nextGenCompletions.push(
                  ...this.processPendingEnd_(lang, context, completion, char));
              break;

            default:
              throw new Error(`Unrecognized state ${completion.state} ` +
                              `(${CallArgumentsStateId[completion.state]}))`);
          }
        }
        completions = nextGenCompletions;
      }

      const inputEnd = inputStart + n;
      for (const completion of completions) {
        const primaryParse: CallParametersPendingParse = {
          parser: this, fnSpec, completion,
          input, inputStart, inputEnd,
          score: completion.score,
          mayContinue: !completion.done,

          getExpression: () => completion.expr,
          getSnippet: () => undefined
        };
        pendingParses.push(primaryParse);
        if (completion.autoCompletions) {
          for (const autocompletion of completion.autoCompletions) {
            const autoCompletionParse: CallParametersPendingParse = {
              parser: this, fnSpec, completion,
              input, inputStart, inputEnd,
              score: completion.score,
              mayContinue: false,

              getExpression: () => autocompletion,
              getSnippet: () => undefined
            };
            pendingParses.push(autoCompletionParse);
          }
        }
      }
      return pendingParses;
    }

    /**
     * Attempt to parse the first character in the call parameters.
     * @param lang The language implementation.
     * @param context The context within which the search is occuring.
     * @param prev The previous search completion state. Should be the initial state.
     * @param fnSpec The function call specification.
     * @param char The character to process in this parse step.
     */
    processEmptyString_(lang: JavaScriptCode,
                        context: SearchContext,
                        prev: CallParametersCompletion,
                        fnSpec: JsFunctionSpec,
                        char: string): CallParametersCompletion[] {
      switch (char) {
        case '.':
        case ',':
        case '[':
          return []; // Explicit no-match
          // TODO: Maybe autocomplete as () if fnSpec.args.length == 0

        case ' ':
          // TODO: Maybe autocomplete as () if fnSpec.args.length == 0
          return [prev];

        case '(': {
          const hasArgs = !!fnSpec.args.length;
          const completion: CallParametersCompletion = {
            state: hasArgs ? CallArgumentsStateId.PENDING_VALUE : CallArgumentsStateId.PENDING_END,
            paramExprs: [],
            score: prev.score + PUNCTUATION_BONUS,
          };
          this.buildAutocompletions_(lang, fnSpec, completion);
          return [completion];
        }

        default: {
          // Unrecognized character
          // TODO: If fnSpec.args.length > 0, attempt delegation parse for the first argument.
          return [];
        }
      }
    }

    /**
     * Parse characters of the call parameters.
     * @param lang The language implementation.
     * @param context The context within which the search is occuring.
     * @param prevParse The previous search completion state.
     * @param fnSpec The function call specification.
     * @param char The character to process in this parse step.
     * @param n The index of the character in parsing.
     * @param pendingParses The place to strore delegated parses.
     */
    processPendingValueOrDelimiter_(lang: JavaScriptCode,
                                    context: SearchContext,
                                    prevParse: CallParametersPendingParse,
                                    fnSpec: JsFunctionSpec,
                                    prev: CallParametersCompletion,
                                    char: string,
                                    n: number,
                                    pendingParses: PendingParse[])
    : CallParametersCompletion[] {
      if (char === ' ') {
        return [prev];
      }
      const needMoreParams = prev.paramExprs.length < fnSpec.args.length;
      let nextDelimiter = undefined;
      if (prev.state === CallArgumentsStateId.PENDING_DELIMITER) {
        if (needMoreParams) {
          nextDelimiter = (prev.paramExprs.length === 0) ? '(' : ',';
        } else if (prev.paramExprs.length === fnSpec.args.length) {
          nextDelimiter = ')';
        }
      }
      if (char === nextDelimiter) {
        const completion: CallParametersCompletion = {
          state: needMoreParams ?
              CallArgumentsStateId.PENDING_VALUE : CallArgumentsStateId.PENDING_END,
          paramExprs: prev.paramExprs,
          score: prev.score + PUNCTUATION_BONUS,
        };
        this.buildAutocompletions_(lang, fnSpec, completion);
        return [completion];
      } else if (needMoreParams) {
        // Unknown character. Assume it is a part of the parameter value.
        pendingParses.push(
            ...this.delegateSubparse_(context, prevParse, fnSpec, n, prev));
      }
      return [];
    }

    /**
     * Attempt to complete the call parameter parse, possibly with a closing
     * parenthesis.
     * @param lang The language implementation.
     * @param context The context within which the search is occuring.
     * @param prev The previous search completion state. Should be the initial state.
     * @param char The character to process in this parse step.
     */
    processPendingEnd_(lang: JavaScriptCode,
                       context: SearchContext,
                       prev: CallParametersCompletion,
                       char: string) : CallParametersCompletion[] {
      if (char === ' ') {
        return [prev];
      }
      // Assuming the prev expressions fulfil the fnSpec arguments.
      if (char === ')') {
        return [{
          ...prev,
          done: true,
          score: prev.score + PUNCTUATION_BONUS,
          autoCompletions: undefined  // Do not allow other matches.
        }];
      }
      // else... no other character should be recognized.
      return [];
    }

    /**
     * Build autocompletion for any incomplete parameters.
     * @param lang The language implementation.
     * @param fnSpec The function call specification.
     * @param completion The completed parse.
     */
    buildAutocompletions_(lang: JavaScriptCode,
                          fnSpec: JsFunctionSpec,
                          completion: CallParametersCompletion) {
      const autoCompletions = buildCallParameterCompletions(lang, fnSpec, completion.paramExprs);
      if (autoCompletions.length > 0 && !completion.expr) {
        completion.expr = autoCompletions.shift();
      }
      if (autoCompletions.length > 0) {
        if (!completion.autoCompletions) {
          completion.autoCompletions = autoCompletions;
        } else {
          completion.autoCompletions.push(...autoCompletions);
        }
      }
    }

    /**
     * Delegate the parsing of the next parameter's expression.
     * @param context The context within which the search is occuring.
     * @param prev The previous search completion state.
     * @param fnSpec The function call specification.
     * @param n The index of the character in parsing.
     * @param completion The parse state thusfar.
     */
    private delegateSubparse_(context: SearchContext,
                              prev: CallParametersPendingParse,
                              fnSpec: JsFunctionSpec,
                              n: number,
                              completion: CallParametersCompletion)
    : PendingParse[] {
      const isValueTypeAllowed =
          (type: ValueType | undefined) => !!type && fnSpec.args[0].isAssignableFrom(type);
      const isExpressionTypeAllowed =
          // Don't allow recursion into self.
          (type: ExpressionType) => type !== CALL_PARAMETERS;
      const subcontext: JsDelegationSubcontext =
          {isValueTypeAllowed, isExpressionTypeAllowed, fnSpec: null};
      return context.delegateSubParse(subcontext, n,
          (context, inputStart, result) => {
            const valueExpr = result.getExpression();
            if (valueExpr) {
              const paramExprs = [...completion.paramExprs, valueExpr];
              const needMore = fnSpec.args.length > paramExprs.length;
              const score = completion.score + result.score;
              return [{
                ...prev,
                input: result.input,
                inputStart,
                inputEnd: result.inputEnd,
                completion: {
                  ...completion,
                  state: needMore ?
                      CallArgumentsStateId.PENDING_DELIMITER : CallArgumentsStateId.PENDING_END,
                  paramExprs,
                  score,
                  autoCompletions: undefined,
                },
                mayContinue: true
              }] as CallParametersPendingParse[];
            } else {
              return [];
            }
          });
    }

    /** @return A new CallParametersCompletion for use with INITIAL_EMPTY_STRING. */
    initialEmptyString_(lang: JavaScriptCode, fnSpec: JsFunctionSpec): CallParametersCompletion {
      const completion = {
        state: CallArgumentsStateId.INITIAL_EMPTY_STRING,
        score: 0,
        usedParen: false,  // Higher match score if used
        paramExprs: [],
        commaCount: 0, // Higher match score if used
        expr: undefined
      };
      this.buildAutocompletions_(lang, fnSpec, completion);
      return completion;
    }

    toString() {
      return 'CallParametersParser';
    }
  }
}
