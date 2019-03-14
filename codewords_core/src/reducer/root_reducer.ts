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

/// <reference path="../editor_state.ts" />
/// <reference path="../action/action_types.ts" />

/// <reference path="./ast_doc.ts" />
/// <reference path="./search_text.ts" />
/// <reference path="./snippets.ts" />

namespace CodeWords.Reducer {
  /**
   * Root EditorState reducer for CodeWords.Editor, applying the next action to
   * create a new, updated EditorState object.
   *
   * @param prev The previous state.
   * @param action The action to apply. One of the ActionTypes interfaces.
   * @return The updated state.
   */
  export function rootReducer(prev: EditorState,
                              action: Action.ActionTypes)
  : EditorState {
    // Order matters!
    // Some state variables are inputs to other reducers. Calculate the inputs first.
    const astDoc = Reducer.astDoc(prev.astDoc, action);
    const predefinedSnippets = Reducer.predefinedSnippets(prev.predefinedSnippets, action);

    const metalines = Reducer.metalines(prev, astDoc);
    const expressionClickHandlers =
        Reducer.expressionClickHandlers(prev.expressionClickHandlers, action);
    const renderedLines = Reducer.renderedLines(prev, metalines);
    const searchText = Reducer.searchText(prev.searchText, action);
    const snippetSuggestFns = Reducer.snippetSuggestFns(prev.snippetSuggestFns, action);

    // Intermediate object passed to the following reducers.
    const newState = {
      ...prev,
      astDoc, metalines, expressionClickHandlers, predefinedSnippets, renderedLines, searchText,
      snippetSuggestFns
    };

    const snippets = Reducer.snippets(prev, newState);
    const dragInProgress = Reducer.dragInProgress(prev.dragInProgress, action);


    return Object.freeze({
      ...newState,
      snippets, dragInProgress
    }) as EditorState;
  }
}
