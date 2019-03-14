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

/// <reference path="./render/meta_line.ts" />
/// <reference path="./snippet/snippet.ts" />
/// <reference path="./snippet/suggest_fn.ts" />
/// <reference path="./ui/drag_in_progress.ts" />
/// <reference path="./ui/editor_view.ts" />
/// <reference path="./ui/on_expression_click.ts" />

/// <reference path="./code_language.ts" />

namespace CodeWords {
  import DragInProgress = CodeWords.UI.DragInProgress;
  import ExpressionClickHandlers = CodeWords.UI.ExpressionClickHandlers;
  import ScoredSnippetWithTargets = CodeWords.Snippet.ScoredSnippetWithTargets;
  import Snippet = CodeWords.Snippet.Snippet;
  import SuggestFn = CodeWords.Snippet.SuggestFn;

  /**
   * The complete editor state.
   */
  export interface EditorState {
    /**
     * A reference to the document.
     *
     * Modified by SetDocumentAction.
     */
    astDoc?: AST.AstDocument;

    /**
     * Information about the snippet currently being dragged, if any.
     */
    dragInProgress?: DragInProgress;

    /**
     * The set of MetaLines in this document.
     *
     * Updated in response to any astDoc change.
     */
    metalines: Render.MetaLine[];

    /**
     * The set of name click handlers for when the user clicks or touches an
     * expression in the document.
     */
    expressionClickHandlers: ExpressionClickHandlers;

    /**
     * The set of MetaLines in this document with rendered HTML attached.
     *
     * Updated in response to any astDoc change (and future font size changes).
     */
    renderedLines: Render.RenderedMetaLine[];

    /**
     * The user's search string in the snippet palette.
     *
     * Modified by SearchUpdateAction.
     */
    searchText: string;

    /**
     * The set of all snippet suggestion functions, used to map search input
     * to possible Snippets.
     * Internal variable. This key/type pair is likely to change.
     */
    snippetSuggestFns: SuggestFn[];

    /**
     * A list of externally defined snippets that preempts suggestions from snippetSuggestFns.
     */
    predefinedSnippets: Snippet[] | undefined;


    /**
     * The current list of snippets displayed (assuming the palette is
     * open), with the highest priority snippets toward the beginning.
     */
    snippets: ScoredSnippetWithTargets[];

    // TODO: Undo stack.
    // TODO: Last edit action / location.
    // TODO: Paths to the document's visible start and end.
  }
}
