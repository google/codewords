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

/// <reference path="../render/drop_target.ts" />
/// <reference path="../snippet/snippet.ts" />

namespace CodeWords.UI {
  import DropTargetWithHtml = CodeWords.Render.DropTargetWithHtml;
  import ScoredSnippetWithTargets = CodeWords.Snippet.ScoredSnippetWithTargets;

  export interface DragInProgress {
    /** The dragged Snippet. */
    snippet: ScoredSnippetWithTargets;

    /**
     * Whether the drag is a precise drag (e.g., mouse or stylus), as opposed
     * to a drag with a touch. Used to determine the placement and separation
     * of realized drop targets and the position of the shadow.
     */
    precise: boolean;

    /** The pixel width of the drag shadow. */
    widthPx: number;
    /** The pixel height of the drag shadow. */
    heightPx: number;
    /** The pixel offset of the drag shadow's left edge from the pointer. */
    offsetX: number;
    /** The pixel offset of the drag shadow's top edge from the pointer. */
    offsetY: number;

    /** The current drop target hovered over, if any. */
    hovered?: DropTargetWithHtml;
  }
}
