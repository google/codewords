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
/// <reference path="./type_keys.ts" />

namespace CodeWords.Action {
  import ExpressionClickHandlers = CodeWords.UI.ExpressionClickHandlers;

  /**
   * Ensure name can be trivially rendered in HTML attributes and delimited
   * by spaces or commas.
   */
  // TODO: Relax this constraint.
  const LEGAL_HANDLER_NAME_RE = /^[A-Za-z][\w-]*$/;

  /** Action object to add new OnExpressionClick handler functions. */
  export interface AddExpressionClickHandlersAction {
    type: TypeKeys.ADD_EXPR_CLICK_HANDLERS;
    onExprClickHandlers: ExpressionClickHandlers;
  }

  /**
   * Creates an action object to add new OnExpressionClick handler functions.
   * Names must be unique with the editors current handlers, unless it is the
   * same function.
   */
  // TODO: Support removing or replacing available click handlers.
  export function addExpressionClickHandlers(onExprClickHandlers: ExpressionClickHandlers)
  : Readonly<AddExpressionClickHandlersAction> {
    for (const name of Object.getOwnPropertyNames(onExprClickHandlers)) {
      if (!LEGAL_HANDLER_NAME_RE.test(name)) {
        throw new Error(`Invalid handler name '${name}'`);
      }
    }

    return Object.freeze({
      type: TypeKeys.ADD_EXPR_CLICK_HANDLERS,
      onExprClickHandlers
    }) as AddExpressionClickHandlersAction;
  }
}
