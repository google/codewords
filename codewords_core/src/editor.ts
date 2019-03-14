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

/// <reference path="./ast/ast_document.ts" />
/// <reference path="./reducer/root_reducer.ts" />
/// <reference path="./ui/drag_update.ts" />
/// <reference path="./ui/editor_view.ts" />
/// <reference path="./code_language.ts" />
/// <reference path="./editor_state.ts" />

namespace CodeWords {
  import ActionTypes = CodeWords.Action.ActionTypes;
  import applyEdit = CodeWords.Action.applyEdit;
  import AstDocument = CodeWords.AST.AstDocument;
  import DragInProgress = CodeWords.UI.DragInProgress;
  import DragUpdateType = CodeWords.UI.DragUpdateType;
  import EditorView = CodeWords.UI.EditorView;
  import ExpressionClickHandlers = CodeWords.UI.ExpressionClickHandlers;
  import ExpressionClick = CodeWords.UI.ExpressionClick;

  /**
   * Assigns the FreezeOptions used by all active Editors.
   * Primarily a debug configuration, so global is assumed safe.
   */
  export let FREEZE_OPTIONS: AST.FreezeOptions;

  /**
   * The Editor class is the primary interface to a CodeWords instance. It
   * manages the DOM UI and related UI subcomponents.
   */
  export class Editor {
    /** The root div of this component. */
    private view_: EditorView;

    private state_: EditorState = {
      metalines: [],
      expressionClickHandlers: Object.create(null),
      predefinedSnippets: undefined,
      renderedLines: [],
      searchText: '',
      snippetSuggestFns: [],
      snippets: []
    };

    /**
     * Constructs a new Editor. Apps and host pages should use
     * CodeWords.inject(..), which will inject the necessary HTML and CSS
     * before creating the Editor.
     *
     * @param div The <div> to populate with the editor UI subcomponents.
     *            Specifically, the injected CodeWords.UI.EDITOR_HTML.
     * @throws If the element does not have the expected structure.
     */
    constructor(div: HTMLElement) {
      if (!(div instanceof HTMLElement)) {
        throw new Error('Expected element as the first argument.');
      }

      this.view_ = new EditorView(div);
      this.view_.setSearchInputListener((searchText) => {
        this.dispatch(Action.setSnippetPaletteContents(searchText));
      });
      this.view_.setDocumentClickListener(
          (event, clickIds, path) => this.onDocumentClick_(event, clickIds, path));
      this.view_.setDragListener(this.onDragUpdate_.bind(this));
    }

    /**
     * @return The current state.
     */
    getCurrentState(): Readonly<EditorState> {
      return Object.freeze(this.state_);
    }

    /**
     * Sets the AST document to be edited, and therefore the editor's
     * CodeLanguage.
     *
     * @param astDocument The document.
     */
    setDocument(astDocument: AstDocument) {
      if (!(astDocument instanceof AstDocument)) {
        throw new Error('Expected AstDocument. Found ' + astDocument);
      }
      this.dispatch(Action.setDocument(astDocument));
    }

    /**
     * Sets the set of snippet suggestion functions used to populate the
     * SnippetPalette.
     * @param snippetSuggestFns The suggestion functions.
     */
    setSnippetSuggestFns(snippetSuggestFns: Snippet.SuggestFn[]) {
      this.dispatch(Action.setSnippetSuggestFns(snippetSuggestFns));
    }

    /**
     * Adds new OnExpressionClick handler functions to the current set.
     * @param expressionClickHandlers
     */
    addExpressionClickHandlers(expressionClickHandlers: ExpressionClickHandlers) {
      this.dispatch(Action.addExpressionClickHandlers(expressionClickHandlers));
    }

    getCodeString() {
      if (!this.state_.astDoc) {
        throw new Error('No document to render.');
      }
      if (this.state_.renderedLines) {
        let output = "";
        for (const line of this.state_.renderedLines) {
          output += line.html.innerText + '\n';
        }
        return output;
      } else {
        throw new Error('UNIMPLEMENTED: getCodeString() before rendered.');
      }
    }

    /**
     * Applies an action to the state.
     * @param action The action object to execute.
     */
    dispatch(action: ActionTypes) {
      this.state_ = Object.freeze(
          Reducer.rootReducer(this.state_, action));

      this.view_.onStateUpdate(this.state_);
    }

    /**
     * Applies an action to the state in the near future.
     * @param action The action object to execute.
     */
    scheduleAction(action: ActionTypes) {
      // Maybe build priority queue
      setTimeout(() => {
        this.dispatch(action);
      }, 0);
    }

    private onDragUpdate_(type: DragUpdateType, dragState: DragInProgress | null) {
      switch (type) {
        case DragUpdateType.START:
          // Defer the state update so the UI can rerender the user drag feedback immediately.
          setTimeout(() => this.dispatch(Action.snippetDragUpdate(type, dragState)), 1);
          return;

        case DragUpdateType.HOVER_CHANGE:
          this.dispatch(Action.snippetDragUpdate(type, dragState));
          return;

        case DragUpdateType.RELEASE:
          // Clear the drag state.
          this.dispatch(Action.snippetDragUpdate(type, null));
          if (dragState && dragState.hovered) {
            const doc = this.state_.astDoc;
            if (!doc) {
              throw new Error('No document for snippet drop.');
            }
            const edit = dragState.snippet.edits[dragState.hovered.id];
            this.dispatch(applyEdit(edit));
          }
          return;

        case DragUpdateType.CANCELED:
          // Clear the drag.
          this.dispatch(Action.snippetDragUpdate(type, null));
          return;

        default:
          throw new Error('Unrecognized DragUpdateType: ' + type);
      }
    }

    private onDocumentClick_(mouseEvent: MouseEvent,
                             clickIds: string[],
                             path: string[]) {
      const exprClick: ExpressionClick = {
        editor: this,
        mouseEvent,
        html: mouseEvent.currentTarget as HTMLElement,
        path,
      };
      for (let i = 0; i < clickIds.length; ++i) {
        const clickId = clickIds[i];
        const handler = this.state_.expressionClickHandlers[clickId];
        if (!handler) {
          console.warn(`No click handler for '${clickId}'`);
          continue;
        }
        if (handler(exprClick)) {
          return true;
        }
      }
      return false; // No handlers claimed the event.
    }
  }
}
