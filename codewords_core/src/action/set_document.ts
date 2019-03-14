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
  /** Action to assign the editor's document root. */
  export interface SetDocumentAction {
    type: TypeKeys.SET_DOCUMENT;
    astDoc: AST.AstDocument;
  }

  /**
   * Creates an action to assign the editor's document root.
   * Triggers a freeze on the AstDocument.
   */
  export function setDocument(astDoc: AST.AstDocument)
  : SetDocumentAction {
    return Object.freeze({
      type: TypeKeys.SET_DOCUMENT,
      astDoc: astDoc.freeze(CodeWords.FREEZE_OPTIONS) as AST.AstDocument
    }) as SetDocumentAction;
  }
}