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

/// <reference path="./apply_edit.ts" />
/// <reference path="./set_document.ts" />
/// <reference path="./set_snippet_suggest_fns.ts" />
/// <reference path="./snippet_drag_update.ts" />
/// <reference path="./type_keys.ts" />

namespace CodeWords.Action {
  export type ActionTypes =
      | AddExpressionClickHandlersAction
      | ApplyEditAction
      | SetDocumentAction
      | SetSnippetPaletteAction
      | SetSnippetSuggestFnsAction
      | SnippetDragUpdateAction
      | OtherAction;

  /**
   * Faux action type to make TypeScript happy when using a strongly typed
   * action pattern in a switch that may have undeclared action types.
   * See https://spin.atomicobject.com/2017/07/24/redux-action-pattern-typescript/
   */
  export interface OtherAction {
    type: TypeKeys.OTHER_ACTION;
  }
}
