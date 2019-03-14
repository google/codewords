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

/// <reference path="../code_language.ts" />
/// <reference path="../ui/drag_in_progress.ts" />
/// <reference path="./document_view.ts" />
/// <reference path="./html_and_css.ts" />
/// <reference path="./drag_in_progress.ts" />
/// <reference path="./snippet_palette.ts" />

namespace CodeWords.UI {
  import DragInProgress = CodeWords.UI.DragInProgress;

  /**
   * The Editor class is the primary interface to a CodeWords instance. It
   * manages the DOM UI and related UI subcomponents.
   */
  export class EditorView {
    /** The root div of this component. */
    private div_: HTMLElement;

    /** The view containing the rendered, scrollable document. */
    private docView_: DocumentView;

    /** The drawer containing the snippet search and snippet palette. */
    private drawer_: HTMLElement;

    /** The scrollable container with the available snippets. */
    private palette_: SnippetPalette;

    /** The text input for searching snippets. */
    private searchInput_: HTMLInputElement;

    /**
     * A transparent overlay layer that can capture may contain the offset drop
     * targets and possible animation effects.
     */
    private overlay_: Overlay;

    private dragListener_: DragUpdateListener;

    /**
     * Constructs a new Editor. Apps and host pages should use CodeWords.inject(..),
     * which will inject the necessary HTML and CSS before creating the Editor.
     *
     * @param div The <div> to populate with the editor UI subcomponents.
     *            Specificially, the injected CodeWords.UI.EDITOR_HTML.
     * @throws If the element does not have the expected structure.
     */
    constructor(div: HTMLElement) {
      if (!(div instanceof HTMLElement)) {
        throw new Error('Expected element as the first argument.');
      }

      this.div_ = div;
      const docViewDiv = this.getSingletonDescendant_('cw-docview');
      this.docView_ = new DocumentView(docViewDiv);
      this.drawer_ = this.getSingletonDescendant_('cw-drawer');
      const paletteDiv = this.getSingletonDescendant_('cw-palette');
      this.palette_ = new SnippetPalette(paletteDiv);
      this.searchInput_ = this.getSingletonDescendant_('cw-input') as HTMLInputElement;
      const overlayDiv = this.getSingletonDescendant_('cw-overlay');
      this.overlay_ = new Overlay(overlayDiv);

      this.palette_.setOnDragStart(this.onDragStart_.bind(this));
    }

    setSearchInputListener(listener: (searchText: string) => void) {
      // TODO: Refactor to allow listener cleanup
      this.searchInput_.addEventListener('input', () => {
        listener(this.searchInput_.value);
      });
    }

    setDragListener(listener: DragUpdateListener) {
      this.dragListener_ = listener;
      this.overlay_.setDragUpdateListener(listener);
    }

    setDocumentClickListener(listener: DocumentClickListener) {
      this.docView_.setClickListener(listener);
    }

    onStateUpdate(state: EditorState) {
      if (this.searchInput_.value !== state.searchText) {
        // Search text was updated by something other than the search <input>.
        // This will loose cursor/selection state.  Probably okay.
        this.searchInput_.value = state.searchText;

        // Probably intending to edit. May change.
        // May need to expose focus state with editor state.
        this.searchInput_.focus();
      }

      this.docView_.onStateUpdate(state);
      this.overlay_.onStateUpdate(state);
      this.palette_.onStateUpdate(state);
    }

    /**
     * Finds descendant elements by class name, asserting there is exactly one.
     * Casts the Element to HTMLElement for the caller.
     *
     * @param className The class name to search for.
     * @returns The found element.
     * @throws If the element is not found, or multiple are found.
     */
    private getSingletonDescendant_(className: string): HTMLElement {
      const elems = this.div_.getElementsByClassName(className);
      if (elems.length !== 1) {
        throw new Error(`Expected one ${className}, found ${elems.length}.`);
      }
      return elems.item(0) as HTMLElement;
    }

    private onDragStart_(event: PointerEvent,
                         snippet: Snippet.ScoredSnippetWithTargets,
                         paletteSnippet: HTMLElement) {
      const bounds = paletteSnippet.getBoundingClientRect();

      const drag: DragInProgress = {
        snippet,
        precise: event.pointerType !== 'touch',
        widthPx: bounds.width,
        heightPx: bounds.height,
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top
      };
      this.overlay_.beginDrag(event, drag, paletteSnippet);

      if (this.dragListener_) {
        this.dragListener_(DragUpdateType.START, drag);
      }
    }
  }
}
