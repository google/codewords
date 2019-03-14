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

/// <reference path="../snippet/snippet.ts" />

namespace CodeWords.UI {
  /**
   * Read-only subset of EditorState used by the SnippetPalette.
   * See SnippetPalette.onStateUpdate(..).
   */
  export interface SnippetPaletteState {
    readonly dragInProgress?: DragInProgress;
    readonly snippets: Snippet.ScoredSnippetWithTargets[];
  }

  /**
   * Callback function when a snippet begins to be dragged.
   * See SnippetPalette.setOnDragStart(..).
   */
  export type OnSnippetDragStart = (event: PointerEvent,
                                    snippet: Snippet.ScoredSnippetWithTargets,
                                    paletteSnippet: HTMLElement) => void;

  /**
   * The SnippetPalette contains the list of Snippets available to the user,
   * usually after a search.
   */
  export class SnippetPalette {
    private div_: HTMLElement;
    private onDragStart_: OnSnippetDragStart;
    private isDragging_ = false;

    /**
     * @param div The <div> to populate with the snippet palette view HTML.
     *            Specifically, the `cw-palette` of the injected
     *            CodeWords.UI.EDITOR_HTML.
     */
    constructor(div: HTMLElement) {
      this.div_ = div;
    }

    setOnDragStart(onDragStart:OnSnippetDragStart) {
      this.onDragStart_ = onDragStart;
    }

    /**
     * Populates the palette view with the provided Snippets, in approximate
     * order.
     * @param state The updated state.
     */
    onStateUpdate(state: SnippetPaletteState) {
      this.isDragging_ = !!state.dragInProgress;

      // TODO: wrap DOM in object that can store size, shape, and layout data.
      const snippetHtml: HTMLElement[] = [];
      for (const snippet of state.snippets) {
        const div = Render.renderSnippet(snippet.snippet);
        div.onpointerdown = (event) => {
          this.onPointerDown_(event, snippet, div);
        };
        snippetHtml.push(div);
      }

      // TODO: Measure snippets and layout based on size, shape, and packing.

      // TODO: If the search context search text only changed by a small
      //       amount, save scroll state and animate snippet changes.
      this.div_.innerHTML = '';
      for (const html of snippetHtml) {
        this.div_.appendChild(html);
        this.div_.insertAdjacentText('beforeend', ' ');
      }
    }

    onPointerDown_(event: PointerEvent,
                   snippet: Snippet.ScoredSnippetWithTargets,
                   snippetDiv: HTMLElement) {
      if (!this.isDragging_ && event.isPrimary && this.onDragStart_) {
        this.onDragStart_(event, snippet, snippetDiv);
      }
    }
  }
}
