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

describe('CodeWords.AST.DynamicSlotsExpression', function() {

  // Type alias
  const Expression = CodeWords.AST.Expression;
  const ExpressionType = CodeWords.AST.ExpressionType;
  const DynamicSlotsExpression = CodeWords.AST.DynamicSlotsExpression;
  const LeafExpression = CodeWords.AST.LeafExpression;

  // Constants
  const TYPE_A = new ExpressionType('a', DynamicSlotsExpression);
  const TYPE_B = new ExpressionType('b', DynamicSlotsExpression);
  const TYPE_PARENT = new ExpressionType('parent', DynamicSlotsExpression);
  const TYPE_CHILD = new ExpressionType('child', LeafExpression);
  const EXAMPLE_LANG = new CodeWords.CodeLanguage('ExampleLang', [TYPE_A, TYPE_B, TYPE_PARENT, TYPE_CHILD]);

  it('extends Expression', () => {
    let expr = new DynamicSlotsExpression(EXAMPLE_LANG, 'a');
    expect(expr instanceof Expression).toBe(true);
  });

  describe('constructor', () => {
    it('throws if there are not two arguments.', () => {
      expect(function () {
        new DynamicSlotsExpression();
      }).toThrowError();

      expect(function () {
        new DynamicSlotsExpression(EXAMPLE_LANG);
      }).toThrowError();
    });
  });


  describe('.makeShallowClone(..)', () => {
    it('copies language, expression type, slots and children.', () => {
      let expr = new DynamicSlotsExpression(EXAMPLE_LANG, 'parent');
      expr.append(
          new Expression(EXAMPLE_LANG, 'a'),
          new Expression(EXAMPLE_LANG, 'b'));

      expect(expr.slotNames_.length).toBeGreaterThan(0);
      expect(Object.keys(expr.children_).length).toBeGreaterThan(0);

      let clone = expr.makeShallowClone();

      expect(clone.language).toBe(expr.language);
      expect(clone.typeId).toBe(expr.typeId);

      expect(clone.slotNames_).not.toBe(expr.slotNames_);
      expect(clone.slotNames_).toEqual(expr.slotNames_);

      expect(clone.children_).not.toBe(expr.children_);
      expect(clone.children_).toEqual(expr.children_);
    });

    it('does not freeze the slots or child lists', () => {
      let expr = new DynamicSlotsExpression(EXAMPLE_LANG, 'parent');
      expr.append(
          new Expression(EXAMPLE_LANG, 'a'),
          new Expression(EXAMPLE_LANG, 'b'));

      expect(expr.slotNames_.length).toBeGreaterThan(0);
      expect(Object.keys(expr.children_).length).toBeGreaterThan(0);

      let clone = expr.makeShallowClone();

      expect(Object.isFrozen(clone.slotNames_)).toBe(false);
      expect(Object.isFrozen(clone.children_)).toBe(false);
    });
  });

  // TODO: Test makeShallowCloneOptions()
  // TODO: Test append uses splice()
  // TODO: Test constructor uses splice()
  // TODO: Test splice(): Appending
  // TODO: Test splice(): Insertion
  // TODO: Test splice(): Removal
  // TODO: Test splice(): Replace

  // TODO: Test freeze() with FreezeOption.prefixDynamicSlotIndex
});
