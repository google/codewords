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

/// <reference path="editor.ts" />
/// <reference path="ui/html_and_css.ts" />

namespace CodeWords {
  let style_: HTMLStyleElement;

  /**
   * Injects the stylesheet into the web page and an editor UI into the
   * specified container Element.
   *
   * @param containerRef The element that will contain the editor UI, or its id.
   * @param options Optional parameters, yet to be defined.
   * @returns A newly constructed editor.
   */
  export function inject(containerRef: HTMLElement|string, options?: {}): Editor {
    let container: HTMLElement|null;
    if (typeof containerRef === "string") {
      container = document.getElementById(containerRef);
      if (!container) {
        throw new Error(`Cannot find container element with id "${containerRef}"`);
      }
    } else if (containerRef instanceof HTMLElement) {
      container = containerRef;
    } else {
      throw new Error('Expected reference to container element as the first argument.');
    }
    const computedPosition = window.getComputedStyle(container).position;
    if (computedPosition === 'static') {
      // The container must be positioned.
      container.style.position = 'relative';
    }

    // Inject stylesheet if not already constructed.
    if (!style_ || style_.parentElement !== document.head) {
      style_ = document.createElement('style') as HTMLStyleElement;
      style_.setAttribute('type', 'text/css');
      style_.textContent = CodeWords.UI.STYLESHEET_CSS;
      document.head.appendChild(style_);
    }

    container.innerHTML = CodeWords.UI.EDITOR_HTML;
    return new Editor(container.querySelector('.codewords-editor')! as HTMLElement);
  }
}
