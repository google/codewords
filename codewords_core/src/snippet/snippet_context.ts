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
/// <reference path="./snippet.ts" />

// TODO: Rename as CodeWords.Search.SearchContext.
namespace CodeWords.Snippet {
  import AstDocument = CodeWords.AST.AstDocument;
  import RenderedMetaLine = CodeWords.Render.RenderedMetaLine;
  import SuggestFn = CodeWords.Snippet.SuggestFn;


  /** A subset of the EditorState and SnippetsInput used as input for each snippet SuggestFn. */
  export interface SnippetContext {
    astDoc?: AstDocument;
    renderedLines: RenderedMetaLine[];
    searchText: string;
    snippetSuggestFns: SuggestFn[];
    // TODO: Last edit action, with location path.
  }
}
