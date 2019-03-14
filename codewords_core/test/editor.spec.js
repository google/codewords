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

"use strict";

describe('The CodeWords.Editor', () => {

  // Type alias
  const Editor = CodeWords.Editor;

  describe('constructor', () => {

    it('must have at least one argument', () => {
      expect(() => new Editor()).toThrow();
    });

    it('requires an HTMLElement as the first argument', () => {
      let container = document.createElement('div');
      container.innerHTML = CodeWords.UI.EDITOR_HTML;
      let div = container.firstElementChild;

      expect(() => new Editor(div)).not.toThrow();
      expect(() => new Editor('Not HTMLElement')).toThrow();
    });

    it('throws if the element does not have the expected children', () => {
      let div = document.createElement('div');
      expect(() => new Editor(div)).toThrow();
    });

    it('constructs an EditorView for the provided element', () => {
      let container = document.createElement('div');
      container.innerHTML = CodeWords.UI.EDITOR_HTML;
      let editor = new Editor(container.firstElementChild);

      expect(editor.view_).toBeTruthy();
      expect(editor.view_.div_).toBe(container.firstElementChild);
    });
  });
});