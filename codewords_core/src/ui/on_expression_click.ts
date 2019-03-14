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

namespace CodeWords.UI {
  import Editor = CodeWords.Editor;

  export interface ExpressionClick {
    /** The CodeWords Editor hosting the document. */
    editor: Editor;

    /** The original mouse or pointer event for the click. */
    mouseEvent: MouseEvent;

    /**
     * The DOM element representing the expression (at least the part of the
     * expression that was clicked).
     */
    html: HTMLElement;

    /**
     * The path to the deepest clicked expression registered with the handler.
     */
    path: string[];
  }

  /**
   * Handler for a class of expression click events.
   *
   * @param editor The CodeWords Editor.
   * @param event The original MouseEvent or PointerEvent.
   * @param astDoc The document at the time of the click.
   * @param path The path to the deepest clicked expression registered with the handler.
   * @param html The DOM element representing the expression
   *             (at least the part of the expression that was clicked).
   */
  export type OnExpressionClick = (exprClick: ExpressionClick) => boolean;

  // TODO: OnSnippetClick

  /**
   * Set of named click handlers. Keys should not have whitespaces.
   */
  export type ExpressionClickHandlers = {[key: string]: OnExpressionClick};
}
