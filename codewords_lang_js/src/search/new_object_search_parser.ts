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

namespace CodeWordsJS.Search {
  import Expression = CodeWords.AST.Expression;
  import ValueType = CodeWords.AST.ValueType;
  import DelegationSubcontext = CodeWords.Search.DelegationSubcontext;
  import PendingParse = CodeWords.Search.PendingParse;
  import SearchContext = CodeWords.Search.SearchContext;
  import SearchParser = CodeWords.Search.SearchParser;

  import ExpressionSnippet = CodeWordsJS.Snippet.ExpressionSnippet;
  import JsValueType = CodeWordsJS.Value.JsValueType;
  import ContinueParseCallback = CodeWords.Search.ContinueParseCallback;
  import JsFunctionSpec = CodeWordsJS.Value.JsFunctionSpec;

  const CONSTRUCTOR_MATCH_SCORE = 1111;

  const PARTIAL_NEW_OP = /^n(?:ew?)?$/i;
  const COMPLETE_NEW_OP = /^(new +)(\S*)/i;

  const PARSE_CONSTRUCTOR_REF_SUBCONTEXT: DelegationSubcontext = {
    isValueTypeAllowed: (valueType: ValueType | undefined) => {
      return !!valueType && (valueType as JsValueType).isConstructor();
    }
  };


  export enum NewObjectParseStateId {
    INITIAL_EMPTY_STRING = 0,
    PENDING_NEW_OP = 1
  }

  export interface NewObjectInitialEmptyString {
    stateId: NewObjectParseStateId.INITIAL_EMPTY_STRING;
  }

  export interface PendingNewOperator {
    stateId: NewObjectParseStateId.PENDING_NEW_OP;
  }

  export type NewObjectParseState =
      NewObjectInitialEmptyString | PendingNewOperator;

  export interface NewObjectPendingParse extends PendingParse {
    parser: NewObjectSearchParser;
    state: NewObjectParseState;
  }

  interface ProcessorResults {
    newObjectParseStates: NewObjectParseState[];
    pendingParses: PendingParse[];
  }

  export class NewObjectSearchParser implements SearchParser {
    attemptParse(context: SearchContext,
                 parseStart: number,
                 prevPendingParse: PendingParse | undefined): PendingParse[] {
      if (context.isExpressionTypeAllowed) {
        if (!context.isExpressionTypeAllowed(NEW)) {
          return [];
        }
      }

      const prev = prevPendingParse as NewObjectPendingParse;
      if (CodeWords.Search.validateSearchParserArgs(this, context, parseStart, prev) &&
          prev.state === undefined) {
        throw new Error('Missing ScopedPendingParse.state');
      }

      const input = context.searchText;
      const inputStart = parseStart;
      const length = input.length - inputStart;
      let n = prev ? prev.inputEnd - prev.inputStart : 0;

      // The current generation of potential completion states for the new
      // object expression, starting with the state in the prior PendingParse
      // result.
      let states: NewObjectParseState[] = prev ? [prev.state] : [initialEmptyString_()];
      const pendingParses = [] as PendingParse[];


      // Attempt to apply the next character to each pending state, thereby
      // creating the next generation for the next character.
      for (; n < length; ++n) {
        const char = input[inputStart + n];  // TODO: Test codepoints instead of strings.
        const nextStates = [] as NewObjectParseState[];
        for (const state of states) {
          switch (state.stateId) {
            case NewObjectParseStateId.INITIAL_EMPTY_STRING: {
              const results = this.processEmptyString_(context, char);
              nextStates.push(...results.newObjectParseStates);
              pendingParses.push(...results.pendingParses);
              break;
            }

            case NewObjectParseStateId.PENDING_NEW_OP: {
              const results = this.processPendingNewOperator_(context, state, inputStart, input, n);
              nextStates.push(...results.newObjectParseStates);
              pendingParses.push(...results.pendingParses);
              break;
            }

            default:
              throw new Error(
                  // tslint:disable-next-line no-any
                  `Unexpected stateId: ${NewObjectParseStateId[(state as any).stateId]}`);
          }
        }
        states = nextStates;
      }

      const inputEnd = inputStart + n;
      for (const state of states) {
        const {stateId} = state;
        switch (stateId) {
          case NewObjectParseStateId.PENDING_NEW_OP: {
            pendingParses.push({
              parser: this,
              input, inputStart, inputEnd,
              state, score: 0,
              mayContinue: true,
              getExpression: () => undefined,
              getSnippet: () => undefined
            } as NewObjectPendingParse);
            break;
          }

          default:
            console.error(`UNIMPLEMENTED: ${NewObjectParseStateId[stateId]} => PendingParse`);
        }
      }
      return pendingParses;
    }

    private processEmptyString_(context: SearchContext, char: string): ProcessorResults {
      const results: ProcessorResults = {
        newObjectParseStates: [],
        pendingParses: []
      };
      if (PARTIAL_NEW_OP.test(char)) {
        results.newObjectParseStates.push({
          stateId: NewObjectParseStateId.PENDING_NEW_OP
        });
      }
      results.pendingParses.push(
          ...this.delegateConstructorParse_(context, CONSTRUCTOR_MATCH_SCORE, 0));
      return results;
    }

    private processPendingNewOperator_(context: SearchContext,
                                       prev: PendingNewOperator,
                                       inputStart: number, input: string, n: number) {
      const results: ProcessorResults = {
        newObjectParseStates: [],
        pendingParses: []
      };
      const inputSoFar = input.slice(inputStart, inputStart + n + 1);
      if (PARTIAL_NEW_OP.test(inputSoFar)) {
        results.newObjectParseStates.push(prev);
      } else {
        const match = COMPLETE_NEW_OP.exec(inputSoFar);
        if (match) {
          // Allow other SearchParsers to identify the constructor.
          results.pendingParses.push(
              ...this.delegateConstructorParse_(
                  context, CONSTRUCTOR_MATCH_SCORE, inputStart + match[1].length));
        }
      }
      return results;
    }

    /**
     * Delegates the parsing of the constructor reference to other parsers.
     *
     * @param context The latest SearchContext.
     * @param score The parse score thus far.
     * @param n The index of the character where this substring to parse begins.
     * @return The NewObjectPendingParse that continues the constructor call.
     */
    private delegateConstructorParse_(context: CodeWords.Search.SearchContext,
                                      score: number,
                                      n: number) {
      const onConstructorRef: ContinueParseCallback =
          (context: SearchContext, inputStart: number, subparseResult: PendingParse) =>
              this.onConstructorRefParsed_(context, score, inputStart, subparseResult);
      return context.delegateSubParse(
          PARSE_CONSTRUCTOR_REF_SUBCONTEXT, n, onConstructorRef);
    }

    /**
     * Callback handler for parsing the reference to the constructor.
     *
     * @param context The latest SearchContext.
     * @param priorScore The score for this parse match up until the delegation.
     * @param inputStart The index of the character where this parser began parsing.
     * @param subparseResult A successful resulting parse from parsing part.
     * @return The NewObjectPendingParse that continues the constructor call.
     */
    private onConstructorRefParsed_(context: SearchContext,
                                    priorScore: number,
                                    inputStart: number,
                                    subparseResult: PendingParse)
    : PendingParse[] {
      const lang = context.astDoc!.language as JavaScriptCode;
      const continuingParses: PendingParse[] = [];
      const constructorExpr = subparseResult.getExpression();
      if (constructorExpr) {
        const valueType = constructorExpr.getValueType() as JsValueType;
        const fnSpec = valueType && valueType.isConstructor() && valueType.functionSpec;
        if (fnSpec) {
          const baseScore = priorScore + subparseResult.score;

          // Delegate parameter parsing...
          continuingParses.push(...this.delegateParametersParse_(
              context, constructorExpr, fnSpec, baseScore, subparseResult.inputEnd));

          // In the mean time, populate the autocompletions....
          const input = context.searchText;
          const inputEnd = subparseResult.inputEnd;
          continuingParses.push(...
              this.autocompleteConstructor_(
                  lang, constructorExpr, fnSpec, baseScore, input, inputStart, inputEnd));
        }
      }
      return continuingParses;
    }

    private autocompleteConstructor_(lang: JavaScriptCode,
                                     constructorExpr: Expression,
                                     fnSpec: JsFunctionSpec,
                                     baseScore: number,
                                     input: string,
                                     inputStart: number,
                                     inputEnd: number) {
      const autocompletions: PendingParse[] = [];
      if (fnSpec.autocompletions) {
        for (const fnCompletion of fnSpec.autocompletions) {
          const autocompleteExpr = lang.newOperator(constructorExpr, ...fnCompletion.args);
          const score = baseScore + fnCompletion.score;
          autocompletions.push({
            parser: this,
            input, inputStart, inputEnd, score,
            mayContinue: false,
            getExpression: () => autocompleteExpr,
            getSnippet: () => new ExpressionSnippet(autocompleteExpr, score)
          });
        }
      } else {
        const autocompleteExpr = lang.newOperator(constructorExpr);
        autocompletions.push({
          parser: this,
          input, inputStart, inputEnd,
          score: baseScore,
          mayContinue: false,
          getExpression: () => autocompleteExpr,
          getSnippet: () => new ExpressionSnippet(autocompleteExpr, baseScore)
        });
      }
      return autocompletions;
    }

    /**
     * Delegates the parsing of the constructor parameters to other parsers.
     *
     * @param context The latest SearchContext.
     * @param constructorExpr The expression reference to the constructor.
     * @param fnSpec The constructor's function specification (arguments, etc).
     * @param score The parse score thusfar.
     * @param n The index of the character where this substring to parse begins.
     * @return The NewObjectPendingParse that continues the constructor call.
     */
    private delegateParametersParse_(context: CodeWords.Search.SearchContext,
                                     constructorExpr: Expression,
                                     fnSpec: JsFunctionSpec,
                                     score: number,
                                     n: number) {
      const onConstructorRef: ContinueParseCallback =
          (context: SearchContext, inputStart: number, subparseResult: PendingParse) =>
              this.onParametersParsed_(
                  context, constructorExpr, score, inputStart, subparseResult);
      const subcontext: JsDelegationSubcontext = {
        isExpressionTypeAllowed: (exprType) => (exprType === CALL_PARAMETERS),
        fnSpec
      };
      return context.delegateSubParse(subcontext, n, onConstructorRef);
    }

    /**
     * Callback handler for parsing the constructor parameters.
     *
     * @param context The latest SearchContext.
     * @param constructorExpr The expression reference to the constructor.
     * @param priorScore The score for this parse match up until the delegation.
     * @param inputStart The index of the character where this parser began parsing.
     * @param subparseResult A successful resulting parse from parsing part.
     * @return The NewObjectPendingParse that continues the constructor call.
     */
    private onParametersParsed_(context: SearchContext,
                                constructorExpr: Expression,
                                priorScore: number,
                                inputStart: number,
                                subparseResult: PendingParse)
    : PendingParse[] {
      const paramsExpr = subparseResult.getExpression();
      if (!paramsExpr || paramsExpr.type !== CALL_PARAMETERS) {
        return [];
      }
      const lang = context.astDoc!.language as JavaScriptCode;

      const {input, inputEnd} = subparseResult;
      const score = priorScore + subparseResult.score;
      const expr = NEW.newExpression(lang, {
        children: {
          'class': constructorExpr,
          'params': paramsExpr
        }
      });
      const result: PendingParse = {
        parser: this,
        input, inputStart, inputEnd,
        score,
        mayContinue: false,
        getExpression: () => expr,
        getSnippet: () => new ExpressionSnippet(expr, score)
      };
      return [result];
    }

    toString() {
      return 'NewObjectSearchParser';
    }
  }

  /** @return A new PendingCompletion for use with INITIAL_EMPTY_STRING. */
  function initialEmptyString_(): NewObjectInitialEmptyString {
    return {
      stateId: NewObjectParseStateId.INITIAL_EMPTY_STRING,
    };
  }
}
