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

/// <reference path="../action/action_types.ts" />
/// <reference path="../action/type_keys.ts" />
/// <reference path="../ui/on_expression_click.ts" />

namespace CodeWords.Reducer {
  import ActionTypes = CodeWords.Action.ActionTypes;
  import ExpressionClickHandlers = CodeWords.UI.ExpressionClickHandlers;
  import TypeKeys = CodeWords.Action.TypeKeys;

  export function expressionClickHandlers(prev: ExpressionClickHandlers,
                                          action: ActionTypes)
  : ExpressionClickHandlers {
    switch (action.type) {
      case TypeKeys.ADD_EXPR_CLICK_HANDLERS: {
        const merged = {...prev};
        for (const key of Object.getOwnPropertyNames(action.onExprClickHandlers)) {
          const handler = action.onExprClickHandlers[key];
          const prior = merged[key];
          if (prior && prior !== handler) {
            throw new Error(`EditorState already has OnExpressionClickHandler names '${key}'`);
          }
          merged[key] = handler;
        }
        return merged;
      }

      default:
        return prev;
    }
  }
}
