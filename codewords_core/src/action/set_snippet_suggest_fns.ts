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

/// <reference path="../snippet/suggest_fn.ts" />

/// <reference path="./action_types.ts" />
/// <reference path="./type_keys.ts" />

namespace CodeWords.Action {
  /** Action to assigns the editor's document root. */
  export interface SetSnippetSuggestFnsAction {
    type: TypeKeys.SET_SNIPPET_SUGGEST_FNS;
    suggestFns: Snippet.SuggestFn[];
  }

  /**
   * Creates an action that assigns the editor's snippet suggesting functions.
   */
  export function setSnippetSuggestFns(suggestFns: Snippet.SuggestFn[])
  : SetSnippetSuggestFnsAction {
    return Object.freeze({
      type: TypeKeys.SET_SNIPPET_SUGGEST_FNS,
      suggestFns: Object.freeze(suggestFns)
    }) as SetSnippetSuggestFnsAction;
  }
}