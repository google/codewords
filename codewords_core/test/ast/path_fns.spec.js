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

describe('CodeWords.AST.clonePath(..)', function() {
  const DOC = new CodeWords.AST.AstDocumentType('DOC');
  const DYNAMIC = new CodeWords.AST.DynamicSlotsExpressionType('DYNAMIC');
  const FIXED = new CodeWords.AST.FixedSlotsExpressionType('FIXED', ['a', 'b', 'c']);
  const LEAF = new CodeWords.AST.LeafExpressionType('LEAF');

  const LANG = new CodeWords.CodeLanguage('LANG', [DOC, DYNAMIC, FIXED, LEAF]);

  beforeEach(() => {
    this.leafA = LEAF.newExpression(LANG);
    this.leafB = LEAF.newExpression(LANG);
    this.leafC = LEAF.newExpression(LANG);

    this.originalDoc = DOC.newExpression(LANG, {
      children: [
          DYNAMIC.newExpression(LANG, {
            children: [this.leafA, this.leafB, this.leafC],
            slotNames: ['a', 'b', 'c']
          }),
          FIXED.newExpression(LANG, {
            children: {a: this.leafA, b: this.leafB, c: this.leafC}
          })
      ],
      slotNames: ['dynamic', 'fixed']
    })
  });

  it('creates clone with the same children, if path is empty', () => {
    const path = [];
    const doc = this.originalDoc;
    const clonedPath = CodeWords.AST.clonePath(doc, path);

    // Always clone the root
    expect(clonedPath.length).toBe(path.length + 1);

    const clonedRoot = clonedPath[0];
    expect(clonedRoot).not.toBe(doc);
    expect(clonedRoot.type).toBe(doc.type);

    expect(clonedRoot.getSlotNames()).toEqual(doc.getSlotNames());
    expect(clonedRoot.getChildren()).toEqual(doc.getChildren());

    for (const slot of clonedRoot.getSlotNames()) {
      expect(clonedRoot.getChild(slot)).toBe(doc.getChild(slot));
    }
  });

  it('can clone a DynamicSlotsExpression with a cloned specified descendant', () => {
    const path = ['dynamic', 'b'];
    const doc = this.originalDoc;
    const clonedPath = CodeWords.AST.clonePath(doc, path);

    // Root plus each named child.
    expect(clonedPath.length).toBe(path.length + 1);

    const clonedRoot = clonedPath[0];
    expect(clonedRoot).not.toBe(doc);
    expect(clonedRoot.type).toBe(doc.type);
    expect(Object.isFrozen(clonedRoot)).toBe(false);
    expect(Object.isFrozen(clonedRoot.slotNames_)).toBe(false);
    expect(Object.isFrozen(clonedRoot.children_)).toBe(false);

    const dynamic = doc.getChild('dynamic');
    const dynamicClone = clonedRoot.getChild('dynamic');
    expect(dynamicClone).not.toBe(dynamic);
    expect(dynamicClone.type).toBe(dynamic.type);
    expect(dynamicClone.getSlotNames()).toEqual(dynamic.getSlotNames());
    expect(Object.isFrozen(dynamicClone)).toBe(false);
    expect(Object.isFrozen(dynamicClone.slotNames_)).toBe(false);
    expect(Object.isFrozen(dynamicClone.children_)).toBe(false);

    const leaf = dynamic.getChild('b');
    const leafClone = dynamicClone.getChild('b');
    expect(leafClone).not.toBe(leaf);
    expect(leafClone.type).toBe(leaf.type);
    expect(Object.isFrozen(leafClone)).toBe(false);

    // Other descendants are not changed
    expect(clonedRoot.getChild('fixed')).toBe(doc.getChild('fixed'));
    expect(dynamicClone.getChild('a')).toBe(dynamic.getChild('a'));
    expect(dynamicClone.getChild('c')).toBe(dynamic.getChild('c'));
  });

  it('can clone a FixedSlotsExpression with a cloned specified descendant', () => {
    const path = ['fixed', 'b'];
    const doc = this.originalDoc;
    const clonedPath = CodeWords.AST.clonePath(doc, path);

    // Root plus each named child.
    expect(clonedPath.length).toBe(path.length + 1);

    const clonedRoot = clonedPath[0];
    expect(clonedRoot).not.toBe(doc);
    expect(clonedRoot.type).toBe(doc.type);
    expect(Object.isFrozen(clonedRoot)).toBe(false);
    expect(Object.isFrozen(clonedRoot.slotNames_)).toBe(false);
    expect(Object.isFrozen(clonedRoot.children_)).toBe(false);

    const fixed = doc.getChild('fixed');
    const fixedClone = clonedRoot.getChild('fixed');
    expect(fixedClone).not.toBe(fixed);
    expect(fixedClone.type).toBe(fixed.type);
    expect(fixedClone.getSlotNames()).toEqual(fixed.getSlotNames());
    expect(Object.isFrozen(fixedClone)).toBe(false);
    expect(Object.isFrozen(fixedClone.slotNames_)).toBe(true);
    expect(Object.isFrozen(fixedClone.children_)).toBe(false);

    const leaf = fixed.getChild('b');
    const leafClone = fixedClone.getChild('b');
    expect(leafClone).not.toBe(leaf);
    expect(leafClone.type).toBe(leaf.type);
    expect(Object.isFrozen(leafClone)).toBe(false);

    // Other descendants are not changed
    expect(clonedRoot.getChild('dynamic')).toBe(doc.getChild('dynamic'));
    expect(fixedClone.getChild('a')).toBe(fixed.getChild('a'));
    expect(fixedClone.getChild('c')).toBe(fixed.getChild('c'));
  });

  it('will throw if the path is bad', () => {
    expect(() => {
      CodeWords.AST.clonePath(this.originalDoc, undefined);
    }).toThrow();

    expect(() => {
      CodeWords.AST.clonePath(this.originalDoc, ['dynamic', 'bad']);
    }).toThrow();

    expect(() => {
      CodeWords.AST.clonePath(this.originalDoc, ['fixed', 'bad']);
    }).toThrow();
  });
});
