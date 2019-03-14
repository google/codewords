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

describe('CodeWords.inject()', () => {
  beforeEach(() => {
    // Remove all body elements.
    let children = document.body.children;
    for (let i = children.length; i > 0;) {
      document.body.removeChild(children[--i]);
    }

    // Remove all <style>s under <head>
    var styles = document.head.querySelectorAll('style');
    for (let i = styles.length; i > 0;) {
      document.head.removeChild(styles[--i]);
    }
  });

  it('fails with empty arguments', () => {
    expect(() => {CodeWords.inject()}).toThrow();
  });

  it('fails if the first argument is not an HTMLElement or element id', () => {
    const CONTAINER_ID = 'CONTAINER_ID';
    let container = document.createElement('div');
    container.id = CONTAINER_ID;
    document.body.appendChild(container);

    expect(() => CodeWords.inject(container)).not.toThrow();
    expect(() => CodeWords.inject(CONTAINER_ID)).not.toThrow();
    expect(() => CodeWords.inject('Not HTMLElement or id')).toThrow();
  });

  it('returns a newly constructed CodeWords.Editor', () => {
    let container = document.createElement('div');
    document.body.appendChild(container);
    let editor = CodeWords.inject(container);

    expect(editor instanceof CodeWords.Editor).toBe(true);
  });

  it('injects the CSS stylesheet on the first call, but not later calls', () => {
    let container = document.createElement('div');
    document.body.appendChild(container);

    // First inject() call
    let styleCountBefore = document.head.querySelectorAll('style').length;
    CodeWords.inject(container);
    let styleCountAfterFirstInject = document.head.querySelectorAll('style').length;

    expect(styleCountAfterFirstInject).toEqual(styleCountBefore + 1);

    // Second inject() call
    CodeWords.inject(container);
    let styleCountAfterSecondInject = document.head.querySelectorAll('style').length;

    expect(styleCountAfterSecondInject).toEqual(styleCountAfterFirstInject);  // No change.
  });

  it('injects the editor UI into the specified container.', () => {
    let container = document.createElement('div');
    document.body.appendChild(container);

    expect(container.childElementCount).toEqual(0);

    CodeWords.inject(container);
    expect(container.childElementCount).toEqual(1);
    expect(container.children[0].classList).toContain('codewords-editor');
  });
});