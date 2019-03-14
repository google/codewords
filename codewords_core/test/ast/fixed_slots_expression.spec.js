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

describe('The CodeWords.AST.FixedSlotsExpression', function() {

  // Type alias
  const Expression = CodeWords.AST.Expression;
  const FixedSlotsExpression = CodeWords.AST.FixedSlotsExpression;
  const FixedSlotsExpressionType = CodeWords.AST.FixedSlotsExpressionType;
  const LeafExpressionType = CodeWords.AST.LeafExpressionType;

  // Constants
  const SLOT_1 = 'SLOT_1';
  const SLOT_2 = 'SLOT_2';

  var EXAMPLE_SLOTS, FROZEN_SLOTS, TYPE_A, TYPE_PARENT, TYPE_CHILD, EXAMPLE_LANG, CHILD_A, CHILD_B;
  beforeEach(() => {
    EXAMPLE_SLOTS = [SLOT_1, SLOT_2, 'digits123', 'CapitalLetters', '_under_score_'];
    FROZEN_SLOTS = [SLOT_1, SLOT_2];
    Object.freeze(FROZEN_SLOTS);

    TYPE_A = new FixedSlotsExpressionType('a', EXAMPLE_SLOTS);
    TYPE_PARENT = new FixedSlotsExpressionType('parent', EXAMPLE_SLOTS);
    TYPE_CHILD = new LeafExpressionType('child');
    EXAMPLE_LANG = new CodeWords.CodeLanguage('ExampleLang', [TYPE_A, TYPE_PARENT, TYPE_CHILD]);

    CHILD_A = EXAMPLE_LANG.newExpression('child');
    CHILD_B = EXAMPLE_LANG.newExpression('child');
  });

  it('extends Expression', () => {
    let expr = new FixedSlotsExpression(EXAMPLE_LANG, 'parent', EXAMPLE_SLOTS);
    expect(expr instanceof Expression).toBeTruthy();
  });

  describe('constructor', () => {
    it('throws if there are not three arguments.', () => {
      expect(function () {
        new FixedSlotsExpression();
      }).toThrowError();

      expect(function () {
        new FixedSlotsExpression(EXAMPLE_LANG);
      }).toThrowError();

      expect(function () {
        new FixedSlotsExpression(EXAMPLE_LANG, 'type id');
      }).toThrowError();
    });

    it('throws if the typeId does not match the language typeIds.', () => {
      expect(function () {
        new FixedSlotsExpression(EXAMPLE_LANG, 'xyz');
      }).toThrowError();
    });

    it('assigns the CodeLanguage the .language property', () => {
      let expr = new FixedSlotsExpression(EXAMPLE_LANG, 'a', EXAMPLE_SLOTS);

      expect(expr.language).toBe(EXAMPLE_LANG);
    });

    it('assigns the type string to the .type property', () => {
      let expr = new FixedSlotsExpression(EXAMPLE_LANG, 'a', EXAMPLE_SLOTS);

      expect(expr.type).toBe(TYPE_A);
    });

    it('accepts a list of slot names that can be retrieved by getSlotNames', () => {
      let expr = new FixedSlotsExpression(EXAMPLE_LANG, 'a', EXAMPLE_SLOTS);
      expect(expr.getSlotNames()).toEqual(EXAMPLE_SLOTS);
    });

    it('it will use the provided slot name array instance if it is frozen', () => {
      expect(Object.isFrozen(TYPE_A.slotNames)).toBe(true);
      let expr = new FixedSlotsExpression(EXAMPLE_LANG, 'a');
      expect(expr.getSlotNames()).toBe(TYPE_A.slotNames);
    });

    it('accepts a map of initial children in the options. ' +
        'Each child can be retrieved via getChild.', () => {
      let expr = new FixedSlotsExpression(
          EXAMPLE_LANG, 'parent', {children: {SLOT_1: CHILD_A, SLOT_2: CHILD_B}});

      expect(expr.getChild(SLOT_1)).toBe(CHILD_A);
      expect(expr.getChild(SLOT_2)).toBe(CHILD_B);
    });

    it('throws if any child name is not a slot name', () => {
      expect(function () {
        new FixedSlotsExpression(EXAMPLE_LANG, 'parent', {children: {'not a slot': CHILD_A}});
      }).toThrow();
    });
  });

  describe('.makeShallowClone(..)', () => {
    it('copies language, expression type, slots and children.', () => {
      let expr = new FixedSlotsExpression(EXAMPLE_LANG, 'a', EXAMPLE_SLOTS);
      expr.setChild(SLOT_1, CHILD_A);
      expr.setChild(SLOT_2, CHILD_B);

      expect(expr.slotNames_.length).toBeGreaterThan(0);
      expect(Object.keys(expr.children_).length).toBeGreaterThan(0);

      let clone = expr.makeShallowClone();

      expect(clone.language).toBe(expr.language);
      expect(clone.typeId).toBe(expr.typeId);
      expect(clone.slotNames_).toBe(expr.slotNames_); // Same frozen instance.
      expect(clone.children_).toEqual(expr.children_);
    });
  });

  describe('.freeze()', () => {
    it('freezes the slot names', () => {
      let expr = new FixedSlotsExpression(
          EXAMPLE_LANG,
          'parent',
          [...EXAMPLE_SLOTS],
          {SLOT_1: CHILD_A, SLOT_2: CHILD_B});

      expect(Object.isFrozen(expr)).toBe(false);
      expect(Object.isFrozen(expr.getSlotNames())).toBe(true);
    })
  });

  // TODO: Test makeShallowCloneOptions()
});
