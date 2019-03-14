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
  const TypeKeys = Action.TypeKeys;

  export function searchText(prev: string, action: Action.ActionTypes): string {
    switch (action.type) {
      case TypeKeys.SET_SNIPPET_PALETTE_CONTENTS:
        return action.searchText;

      default:
        return prev;
    }
  }
}
