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

namespace CodeWords.Action {
  import Snippet = CodeWords.Snippet.Snippet;

  /** Action object to override the snippet palette contents. */
  export interface SetSnippetPaletteAction {
    type: TypeKeys.SET_SNIPPET_PALETTE_CONTENTS;

    /**
     * The snippet search text.
     */
    searchText: string;

    /**
     * An optional list of predefined snippets to display, assuming the palette
     * is open). If defined, this list preempts the SuggestFns and the snippets
     * generated therein. If undefined, the SuggestFns will use the searchText
     * to determine the snippets, as normal.
     */
    predefinedSnippets?: Snippet[];
  }

  /** Creates the action object which overrides the snippet palette contents. */
  export function setSnippetPaletteContents(searchText: string,
                                            predefinedSnippets?: Snippet[])
  : SetSnippetPaletteAction {
    return {
      type: TypeKeys.SET_SNIPPET_PALETTE_CONTENTS,
      searchText, predefinedSnippets
    };
  }
}
