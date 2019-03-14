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

/// <reference path="../ast/expression.ts" />
/// <reference path="../render/drop_target.ts" />
/// <reference path="../render/span.ts" />

namespace CodeWords.Snippet {
  import DropTargetWithExpressions = CodeWords.Render.DropTargetWithExpressions;
  import DropTargetWithHtml = CodeWords.Render.DropTargetWithHtml;
  import Span = CodeWords.Render.Span;

  /**
   * A draggable representation of code that can be inserted, possibly via
   * a transformation to the original document.
   *
   * Each potential edit comes from the application of the Snippet's
   * maybeBuildInsertionEdit function to a specific drop target. The edit
   * may mutated or vetoed by the drop target's mutateInsertionEditFn. This
   * allows certain locations to constrain or promote certain inputs. For
   * example, preferring recognized filenames or modules, or disallowing
   * negative and fractional array indices.
   *
   * The scores of all resulting edits are used to prioritize all the
   * Snippets. The top ranking snippets are rendered and populate the
   * SnippetPalette.
   */
  export interface Snippet {
    /**
     * Attempts to generate a potential InsertionEdit for the provided drop
     * target. If the snippet should not interact at that location,
     * implementations should return null.
     *
     * The drop target's referenced Expression is provided for convenience,
     * as is that expression's parent. Either may be null, but never both.
     * A target may replace a non-existent child, or the referenced expression
     * may be the root document.
     *
     * @param dropTargetInfo The drop target and relevant expressions.
     * @return The proposed edit, or null if this snippet does not apply at
     *         this location.
     */
    maybeBuildInsertionEdit(dropTargetInfo: DropTargetWithExpressions)
        : InsertionEdit | null;

    /**
     * @return One or more spans (one per line) that will be rendered as the
     *         Snippet's draggable "block" form.
     */
    getDisplaySpans(): Span[];
  }

  /** A Snippet with matching drop target information attached. */
  export interface ScoredSnippetWithTargets {
    snippet: Snippet;
    score: number;
    targets: DropTargetWithHtml[];
    edits: InsertionEditsById;
  }
}