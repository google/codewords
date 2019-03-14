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
/// <reference path="../snippet/calculate_snippets.ts" />
/// <reference path="../snippet/snippet.ts" />
/// <reference path="../snippet/snippet_context.ts" />
/// <reference path="../snippet/suggest_fn.ts" />

namespace CodeWords.Reducer {
  import AstDocument = CodeWords.AST.AstDocument;
  import RenderedMetaLine = CodeWords.Render.RenderedMetaLine;
  import calculateSnippets = CodeWords.Snippet.calculateSnippets;
  import calculateSnippetScores = CodeWords.Snippet.calculateSnippetScores;
  import ScoredSnippetWithTargets = CodeWords.Snippet.ScoredSnippetWithTargets;
  import Snippet = CodeWords.Snippet.Snippet;
  import SuggestFn = CodeWords.Snippet.SuggestFn;

  /**
   * A subset of the EditorState used as input to calculate the snippets.
   * Also happens to be a superset of SnippetContext.
   */
  export interface SnippetsInput {
    astDoc?: AstDocument;
    predefinedSnippets: Snippet[] | undefined;
    renderedLines: RenderedMetaLine[];
    searchText: string;
    snippets: ScoredSnippetWithTargets[];
    snippetSuggestFns: SuggestFn[];
  }

  /**
   * @param prev The previous set of Snippets
   * @param prevContext The previous snippet search context.
   * @param input The input parameters from the current editor state.
   * @return A potentially new set of Snippets to display.
   */
  export function snippets(prev: SnippetsInput,
                           input: SnippetsInput)
  : Snippet.ScoredSnippetWithTargets[] {
    const {astDoc, predefinedSnippets, renderedLines, searchText, snippetSuggestFns} = input;

    if (!astDoc || !snippetSuggestFns || !snippetSuggestFns.length) {
      // No valid context
      return [];
    }

    // TODO: Maybe freeze input before passing it to external functions as SnippetContext.

    if (predefinedSnippets) {
      return calculateSnippetScores(predefinedSnippets, input);
    }

    if (renderedLines === prev.renderedLines &&
        searchText === prev.searchText &&
        snippetSuggestFns === prev.snippetSuggestFns) {
      // No change to search context.
      return prev.snippets;
    }

    return calculateSnippets(snippetSuggestFns, input);
  }
}
