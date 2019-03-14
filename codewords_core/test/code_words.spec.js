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

describe('codewords_core.js', function() {
  it('should include all the public functions and classes of the CodeWords namespace', () => {
    expect(typeof CodeWords.inject).toBe('function');
    expect(typeof CodeWords.CodeLanguage).toBe('function');
    expect(typeof CodeWords.Editor).toBe('function');

    // namespace CodeWords.AST:
    expect(typeof CodeWords.AST.Expression).toBe('function');
    expect(typeof CodeWords.AST.FixedSlotsExpression).toBe('function');
    expect(typeof CodeWords.AST.DynamicSlotsExpression).toBe('function');

    // namespace CodeWords.UI:
    expect(typeof CodeWords.UI.EditorView).toBe('function');
  });

  it('should not pollute the global namespace', () => {
    expect(typeof inject).toBe('undefined');
    expect(typeof CodeLanguage).toBe('undefined');
    expect(typeof Editor).toBe('undefined');

    // namespace CodeWords.AST:
    expect(typeof Expression).toBe('undefined');
    expect(typeof FixedSlotsExpression).toBe('undefined');
    expect(typeof DynamicSlotsExpression).toBe('undefined');

    // namespace CodeWords.UI:
    expect(typeof EditorView).toBe('undefined');
  });
});