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
/// <reference path="../ast/ast_document.ts" />

namespace CodeWords.Reducer {
  import ActionTypes = CodeWords.Action.ActionTypes;
  import ApplyEditAction = CodeWords.Action.ApplyEditAction;
  import TypeKeys = CodeWords.Action.TypeKeys;
  import AstDocument = CodeWords.AST.AstDocument;
  import applyInsertion = CodeWords.Snippet.applyInsertion;

  export function astDoc(prev: AstDocument|undefined,
                         action: ActionTypes)
  : AST.AstDocument|undefined {
    switch (action.type) {
      case TypeKeys.APPLY_EDIT:
        if (!prev) {
          throw Error('No previous document to edit.');
        }
        const insertion = action.insertion;
        return applyInsertion(prev, insertion) as AstDocument;

      case TypeKeys.SET_DOCUMENT:
        return action.astDoc;

      default:
        return prev;
    }
  }
}
