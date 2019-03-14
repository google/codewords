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

// Jasmine functions... (declaration prevents IDE errors)
var describe, it, expect, beforeEach, afterEach;

describe('CodeWords.AST.Expression', function() {

  // Type alias
  const Expression = CodeWords.AST.Expression;
  const ExpressionType = CodeWords.AST.ExpressionType;
  const LeafExpression = CodeWords.AST.LeafExpression;

  // Constants
  const SLOT_1 = 'SLOT_1';
  const SLOT_2 = 'SLOT_2';
  var EXAMPLE_LANG, TYPE_A, TYPE_B, TYPE_PARENT, TYPE_MIDPARENT, EXAMPLE_SLOTS, FROZEN_SLOTS;

  beforeEach(() => {
    TYPE_A = new ExpressionType('a', LeafExpression);
    TYPE_B = new ExpressionType('b', LeafExpression);
    TYPE_PARENT = new ExpressionType('parent', LeafExpression);
    TYPE_MIDPARENT = new ExpressionType('midParent', LeafExpression);
    EXAMPLE_LANG = new CodeWords.CodeLanguage('ExampleLang', [TYPE_A, TYPE_B, TYPE_PARENT, TYPE_MIDPARENT]);

    EXAMPLE_SLOTS = [SLOT_1, SLOT_2, 'digits123', 'CapitalLetters', '_under_score_'];
    FROZEN_SLOTS = [SLOT_1, SLOT_2];
    Object.freeze(FROZEN_SLOTS);
  });

  afterEach(() => {
    // Verify the shared variables did not get perturbed.
    // Should not freeze the provided inputs.
    expect(EXAMPLE_SLOTS.length).toBe(5);
    expect(Object.isFrozen(EXAMPLE_SLOTS)).toBe(false);
  });

  describe('constructor', () => {

    it('throws if there are not two arguments.', () => {
      expect(function() {
        new Expression();
      }).toThrowError();

      expect(function() {
        new Expression(EXAMPLE_LANG);
      }).toThrowError();
    });

    it('throws if the typeId does not match the language typeIds.', () => {
      expect(function() {
        new Expression(EXAMPLE_LANG, 'xyz');
      }).toThrowError();
    });

    it('assigns the CodeLanguage the .language property', () => {
      let expr = new Expression(EXAMPLE_LANG, 'a');

      expect(expr.language).toBe(EXAMPLE_LANG);
    });

    it('assigns .type property the matching ExpressionType', () => {
      let exprA = new Expression(EXAMPLE_LANG, TYPE_A);
      expect(exprA.type).toBe(TYPE_A);

      let exprB = new Expression(EXAMPLE_LANG, 'b');
      expect(exprB.type).toBe(TYPE_B);
    });

    it('it does not create any slots, by default', () => {
      let expr = new Expression(EXAMPLE_LANG, 'a', ['attempt', 'at', 'slots']);

      expect(expr.slotNames_.length).toBe(0);
      expect(expr.getSlotNames().length).toBe(0);
    });

    it('leaves the .slotNames_ and .children_ unfrozen', () => {
      let expr = new Expression(EXAMPLE_LANG, 'parent');

      expect(Object.isFrozen(expr)).toBe(false);
      expect(Object.isFrozen(expr.slotNames_)).toBe(false);
      expect(Object.isFrozen(expr.children_)).toBe(false);
    });
  });

  it('.language is read-only.', () => {
    let expr = new Expression(EXAMPLE_LANG, 'a');

    expect(function() {
      // noinspection JSAnnotator (write to readonly property)
      expr.language = 'other';
    }).toThrow();
  });

  it('.type is read-only.', () => {
    let expr = new Expression(EXAMPLE_LANG, 'a');

    expect(function() {
      // noinspection JSAnnotator (write to readonly property)
      expr.type = 'bad data';
    }).toThrow();
  });

  describe('.getSlotNames()', () => {
    beforeEach(() => {
      this.expr = new (class extends Expression {
        constructor() {
          super(EXAMPLE_LANG, 'parent');
          this.slotNames_ = FROZEN_SLOTS;
        }
      })();
    });

    it('returns .slotNames_', () => {
      expect(this.expr.slotNames_).toBe(FROZEN_SLOTS);
      expect(this.expr.getSlotNames()).toBe(FROZEN_SLOTS);
    });
  });

  describe('.isSlotName(name)', () => {
    beforeEach(() => {
      this.expr = new (class extends Expression {
        constructor() {
          super(EXAMPLE_LANG, 'parent');
          this.slotNames_ = FROZEN_SLOTS;
        }
      })();

      it('returns true for each member of .slotNames_', () => {
        for (const name of FROZEN_SLOTS) {
          expect(this.expr.isSlotName(name)).toBe(true);
        }
      });

      it('returns false things that are not .slotNames_', () => {
        expect(this.expr.isSlotName('not_a_slot')).toBe(false);
        expect(this.expr.isSlotName(undefined)).toBe(false);
        expect(this.expr.isSlotName(null)).toBe(false);
        expect(this.expr.isSlotName(123)).toBe(false);
        expect(this.expr.isSlotName([SLOT_1, SLOT_2])).toBe(false);
        expect(this.expr.isSlotName(FROZEN_SLOTS)).toBe(false);
      });
    });
  });

  describe('.getChild(slotName)', () => {
    beforeEach(() => {
      let childA = this.childA = new Expression(EXAMPLE_LANG, 'a');

      this.expr = new (class extends Expression {
        constructor() {
          super(EXAMPLE_LANG, 'parent');

          this.slotNames_ = [...EXAMPLE_SLOTS];  // Do not leak state
          this.children_ = {
            SLOT_1: childA
          };
        }
      })();
    });

    it('returns the child for the named slot', () => {
      expect(this.expr.getChild(SLOT_1)).toBe(this.childA);
    });

    it('returns null for unassigned slots', () => {
      expect(this.expr.getChild('digits123')).toBe(null);
      expect(this.expr.getChild('CapitalLetters')).toBe(null);
      expect(this.expr.getChild('_under_score_')).toBe(null);
    });
  });

  describe('.getDescendant(..)', () => {
    beforeEach(() => {
      let leaf1 = this.leaf1 = new Expression(EXAMPLE_LANG, 'a');
      let leaf2 = this.leaf2 = new Expression(EXAMPLE_LANG, 'b');
      let midParent = this.midParent = new (class extends Expression {
        constructor() {
          super(EXAMPLE_LANG, 'midParent');

          this.slotNames_ = FROZEN_SLOTS;
          this.children_ = {
            SLOT_1: leaf1,
            SLOT_2: leaf2
          };
        }
      })();
      this.rootParent = new (class extends Expression {
        constructor() {
          super(EXAMPLE_LANG, 'parent');

          this.slotNames_ = FROZEN_SLOTS;
          this.children_ = {
            SLOT_1: midParent
          };
        }
      })();
    });

    it('throws if the first argument is not an array', () => {
      expect(() => {
        this.rootParent.getDescendant(); // missing
      }).toThrow();

      expect(() => {
        this.rootParent.getDescendant(1); // number
      }).toThrow();

      expect(() => {
        this.rootParent.getDescendant(SLOT_1); // string, even if valid slot name
      }).toThrow();
    });

    it('retrieves the root if given the empty path.', () => {
      expect(this.rootParent.getDescendant([/* empty */])).toBe(this.rootParent);
    });

    it('returns the base expression if the start ===0 and end === 0.', () => {
      expect(this.rootParent.getDescendant([SLOT_1], 0, 0)).toBe(this.rootParent);
    });

    it('returns the base expression if start if start === end.', () => {
      expect(this.midParent.getDescendant([SLOT_1, SLOT_2], 1, 1)).toBe(this.midParent);

      // TODO: Check the next path part, even if it is not requested?
      expect(this.midParent.getDescendant(['these', 'dont', 'matter'], 2, 2)).toBe(this.midParent);
    });

    it('can retrieve a deep descendant.', () => {
      expect(this.rootParent.getDescendant([SLOT_1, SLOT_1])).toBe(this.leaf1);
      expect(this.rootParent.getDescendant([SLOT_1, SLOT_2])).toBe(this.leaf2);
    });

    it('returns null for an unassigned child', () => {
      expect(this.rootParent.getDescendant([SLOT_2])).toBe(null);
      expect(this.rootParent.getDescendant(['SLOT_3'])).toBe(null);
      expect(this.rootParent.getDescendant([SLOT_1, SLOT_2, 'SLOT_3'])).toBe(null);
    });

    it('throws if the second and third arguments are not numbers or are out of bounds', () => {
      expect(() => {
        this.rootParent.getDescendant([SLOT_1, SLOT_2], 'not a number');
      }).toThrow();

      expect(() => {
        this.rootParent.getDescendant([SLOT_1, SLOT_2], -1);
      }).toThrow();

      expect(() => {
        this.rootParent.getDescendant([SLOT_1, SLOT_2], 3);
      }).toThrow();

      expect(() => {
        this.rootParent.getDescendant([SLOT_1, SLOT_2], 0, 'not a number');
      }).toThrow();

      expect(() => {
        this.rootParent.getDescendant([SLOT_1, SLOT_2], 0, -1);
      }).toThrow();

      expect(() => {
        this.rootParent.getDescendant([SLOT_1, SLOT_2], 0, 3);
      }).toThrow();
    });
  });

  describe('.assignSlot()', () => {
    beforeEach(() => {
      this.child = new Expression(EXAMPLE_LANG, 'a');

      this.expr = new (class extends Expression {
        constructor() {
          super(EXAMPLE_LANG, 'parent');

          this.slotNames_ = [...EXAMPLE_SLOTS];  // Do not leak state
        }
      })();
    });

    it('sets the Expression for the given slot name', () => {
      expect(this.expr.children_[SLOT_1]).toBeUndefined();
      expect(this.expr.getChild(SLOT_1)).toBeNull();

      this.expr.assignSlot(SLOT_1, this.child);

      expect(this.expr.children_[SLOT_1]).toBe(this.child);
      expect(this.expr.getChild(SLOT_1)).toBe(this.child);
    });
  });

  describe('.freeze(..)', () => {
    it('freezes object, its slots, and its children', () => {
      let childA = new Expression(EXAMPLE_LANG, 'a');
      let childB = new Expression(EXAMPLE_LANG, 'b');
      let expr = new (class extends Expression {
        constructor() {
          super(EXAMPLE_LANG, 'parent');

          this.slotNames_ = [...EXAMPLE_SLOTS];  // Do not leak state
          this.children_ = {
            SLOT_1: childA,
            SLOT_2: childB
          };
        }
      })();

      expect(Object.isFrozen(expr)).toBe(false);
      expect(Object.isFrozen(expr.slotNames_)).toBe(false);
      expect(Object.isFrozen(childA)).toBe(false);
      expect(Object.isFrozen(childB)).toBe(false);

      expr.freeze();

      expect(Object.isFrozen(expr)).toBe(true);
      expect(Object.isFrozen(expr.slotNames_)).toBe(true);
      expect(Object.isFrozen(childA)).toBe(true);
      expect(Object.isFrozen(childB)).toBe(true);
    });
  });

  // TODO: Test makeShallowCloneOptions()
});
