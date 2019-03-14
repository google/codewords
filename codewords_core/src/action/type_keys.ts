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
  /**
   * Unique action `type` ids for all Actions.
   */
  export enum TypeKeys {
    /** Adds new named OnExpressionClick handler functions. */
    ADD_EXPR_CLICK_HANDLERS = 'addExpressionClickHandlers',
    /** Modifies the document. */
    APPLY_EDIT = 'applyEdit',
    /** Assigns the editor's document root. */
    SET_DOCUMENT = 'setDocument',
    /** Set the search text and snippets shown in the palette. */
    SET_SNIPPET_PALETTE_CONTENTS = 'setSnippetPaletteContents',
    /** Set the list of functions the create Snippets from the editor context. */
    SET_SNIPPET_SUGGEST_FNS = 'setSnippetSuggestFns',
    /** The user has begun dragging a snippet. Begin update/highlight drop targets. */
    SNIPPET_DRAG_UPDATE = 'snippetDragUpdate',

    /** Unused faux action, representing all unrecognized action objects. */
    OTHER_ACTION = '__any_other_action_type__'
  }
}
