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

namespace CodeWordsJS.Search {
  import Expression = CodeWords.AST.Expression;

  import CALL_PARAMETERS = CodeWordsJS.CALL_PARAMETERS;
  import JavaScriptCode = CodeWordsJS.JavaScriptCode;
  import JsFunctionSpec = CodeWordsJS.Value.JsFunctionSpec;
  import JsValueType = CodeWordsJS.Value.JsValueType;

  /**
   * Build a list of autocompleted function call expressions or new operator
   * constructor calls for the provided function/constructor reference
   * expression. May return an empty result list if the initial args do not
   * match the function specification (e.g., too many args; args of the wrong
   * type).
   *
   * @param lang The JavaScriptCode for this expression.
   * @param functionExpr The callable object to complete, possibly a constructor.
   * @param optInitialParams An optional list of
   * @return The resulting autocompletions.
   */
  export function buildFunctionCallCompletions(
      lang: JavaScriptCode,
      functionExpr: Expression,
      optInitialParams?: Expression[])
  : Expression[] {
    const fnValueType = functionExpr.getValueType() as JsValueType;
    const fnSpec = fnValueType && fnValueType.functionSpec;

    if (!fnSpec) {
      throw new Error('Missing Expression JsValueType and JsFunctionSpec: ' + functionExpr);
    }

    return buildFunctionCallCompletionsFromParamLists(lang, functionExpr,
        buildCallParameterCompletions(lang, fnSpec, optInitialParams));
  }

  /**
   * Build a list of autocompleted function call expressions or new operator
   * constructor calls for the provided function/constructor reference
   * expression. May return an empty result list if the initial args do not
   * match the function specification (e.g., too many args; args of the wrong
   * type).
   *
   * @param lang The JavaScriptCode for this expression.
   * @param functionExpr The callable object to complete, possibly a constructor.
   * @param callParamsExprs The list of CALL_PARAMETERs to use for completions.
   * @return The resulting autocompletions.
   */
  export function buildFunctionCallCompletionsFromParamLists(
      lang: JavaScriptCode,
      functionExpr: Expression,
      callParamsExprs: Expression[])
  : Expression[] {
    const results: Expression[] = [];
    const fnValueType = functionExpr.getValueType() as JsValueType;
    const fnSpec = fnValueType && fnValueType.functionSpec;

    if (!fnSpec) {
      throw new Error('Missing Expression JsValueType and JsFunctionSpec: ' + functionExpr);
    }
    const {returnType} = fnSpec;

    for (const params of callParamsExprs) {
      if (fnValueType.isConstructor()) {
        results.push(NEW.newExpression(lang, {
          children: {
            'class': functionExpr,
            params
          },
          valueType: returnType
        }));
      } else {
        results.push(FUNCTION_CALL.newExpression(lang, {
          children: {
            'callable': functionExpr,
            params
          },
          valueType: returnType
        }));
      }
    }
    return results;
  }

  /**
   * Build a list of autocompleted call parameter expressions for the provided
   * function specification. May return an empty result list if the initial
   * args do not match the function specification (e.g., too many args; args of
   * the wrong type).
   *
   * @param lang The JavaScriptCode for this expression.
   * @param fnSpec The function specification to autocomplete.
   * @param optInitialParams An optional list of
   * @return The resulting autocompletions.
   */
  export function buildCallParameterCompletions(
      lang: JavaScriptCode,
      fnSpec: JsFunctionSpec,
      optInitialParams: Expression[] | undefined)
  : Expression[] {
    const results: Expression[] = [];
    const initialParams = optInitialParams || [];

    if (initialParams.length === fnSpec.args.length) {
      // Complete with the provided parameters.
      results.push(CALL_PARAMETERS.newExpression(lang, {
        children: initialParams
      }));
    } else if (fnSpec.autocompletions.length > fnSpec.args.length) {
      const count = fnSpec.autocompletions.length;
      for (let i = 0; i < count; ++i) {
        const fnAutoParams = fnSpec.autocompletions[i].args;
        if (initialParams.length < fnAutoParams.length) {
          results.push(CALL_PARAMETERS.newExpression(lang, {
            children: [
              ...initialParams,
              ...fnAutoParams.slice(initialParams.length)
            ]
          }));
        }
      }
    }
    return results;
  }
}
