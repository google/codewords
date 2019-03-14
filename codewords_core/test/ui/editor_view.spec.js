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

describe('The CodeWords.UI.EditorView', () => {

  // Type alias
  const EditorView = CodeWords.UI.EditorView;

  describe('constructor', () => {

    it('must have at least one argument', () => {
      expect(() => new EditorView()).toThrow();
    });

    it('requires an HTMLElement as the first argument', () => {
      let container = document.createElement('div');
      container.innerHTML = CodeWords.UI.EDITOR_HTML;
      let div = container.firstElementChild;

      expect(() => new EditorView(div)).not.toThrow();
      expect(() => new EditorView('Not HTMLElement')).toThrow();
    });

    it('throws if the element does not have the expected children', () => {
      let div = document.createElement('div');
      expect(() => new EditorView(div)).toThrow();
    });

    it('finds the descendant elements of the UI', () => {
      let container = document.createElement('div');
      container.innerHTML = CodeWords.UI.EDITOR_HTML;
      let editor = new EditorView(container.firstElementChild);

      expect(editor.div_).toBeTruthy();
      expect(editor.docView_.div_).toBeTruthy();
      expect(editor.drawer_).toBeTruthy();
      expect(editor.palette_).toBeTruthy();
      expect(editor.searchInput_).toBeTruthy();
    });
  });
});