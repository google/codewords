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

describe('CodeWords.Snippet.applyInsertion(..)', function() {
  const applyInsertion = CodeWords.Snippet.applyInsertion;
  const InsertionEdit = CodeWords.Snippet.InsertionEdit;
  const InsertionType = CodeWords.Snippet.InsertionType;

  const DOC = new CodeWords.AST.AstDocumentType('DOC');
  const DYNAMIC = new CodeWords.AST.DynamicSlotsExpressionType('DYNAMIC');
  const FIXED = new CodeWords.AST.FixedSlotsExpressionType('FIXED', ['a', 'b', 'c']);
  const LEAF = new CodeWords.AST.LeafExpressionType('LEAF');

  const LANG = new CodeWords.CodeLanguage('LANG', [DOC, DYNAMIC, FIXED, LEAF]);

  beforeEach(() => {
    this.leafA = LEAF.newExpression(LANG);
    this.leafB = LEAF.newExpression(LANG);
    this.leafC = LEAF.newExpression(LANG);
    this.leafD = LEAF.newExpression(LANG);
    this.leafE = LEAF.newExpression(LANG);

    this.doc = DOC.newExpression(LANG, {
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

  it('throws if it does not recognize the InsertionType', () => {
    expect(() => {
      applyInsertion(this.doc, {
        // type undefined
        path: ['dynamic'],
        expressions: [this.leafD]
      });
    }).toThrow();

    expect(() => {
      applyInsertion(this.doc, {
        type: 'bad',
        path: ['dynamic'],
        expressions: [this.leafD]
      });
    }).toThrow();

    expect(() => {
      applyInsertion(this.doc, {
        type: -1,
        path: ['dynamic'],
        expressions: [this.leafD]
      });
    }).toThrow();
  });

  it('throws if the path is not defined or bad', () => {
    expect(() => {
      applyInsertion(this.doc, {
        type: InsertionType.append,
        // path undefined
        expressions: [this.leafD]
      });
    }).toThrow();

    expect(() => {
      applyInsertion(this.doc, {
        type: InsertionType.append,
        path: 'bad',
        expressions: [this.leafD]
      });
    }).toThrow();
  });

  it('throws if the expressions are not defined', () => {
    expect(() => {
      applyInsertion(this.doc, {
        type: InsertionType.append,
        path: ['dynamic']
        // expressions undefined
      });
    }).toThrow();
  });

  describe('with type \'append\'', () => {
    it('will append the expressions to a DynamicSlotsExpression', () => {
      const newDoc = applyInsertion(this.doc, {
        type: InsertionType.APPEND,
        path: ['dynamic'],
        expressions: [this.leafD, this.leafE]
      });

      expect(newDoc).not.toBe(this.doc);
      expect(newDoc.type).toBe(this.doc.type);
      expect(newDoc.getSlotNames()).toEqual(this.doc.getSlotNames());

      const oldDynamic = this.doc.getChild('dynamic');
      const newDynamic = newDoc.getChild('dynamic');
      expect(newDynamic).not.toBe(oldDynamic);
      expect(newDynamic.type).toBe(oldDynamic.type);

      let i;
      const sameSlots = oldDynamic.getSlotNames();
      for (i = 0; i < sameSlots.length; ++i) {
        expect(newDynamic.getSlotNames()[i]).toEqual(sameSlots[i]);
      }

      const newSlots = newDynamic.getSlotNames();
      expect(oldDynamic.getChild(newSlots[i])).toBeNull();
      expect(newDynamic.getChild(newSlots[i])).toBe(this.leafD);
      expect(oldDynamic.getChild(newSlots[i + 1])).toBeNull();
      expect(newDynamic.getChild(newSlots[i + 1])).toBe(this.leafE);
    });

    it('will throw when the reference is not a DynamicSlotsExpression', () => {
      expect(() => {
        applyInsertion(this.doc, {
          type: InsertionType.append,
          path: ['fixed'],
          expressions: [this.leafD]
        })
      }).toThrow();

      expect(() => {
        applyInsertion(this.doc, {
          type: InsertionType.append,
          path: ['dynamic', 'a'],
          expressions: [this.leafD]
        })
      }).toThrow();
    });
  });

  describe('with type \'before\'', () => {
    it('will insert expressions before the referenced child of a DynamicSlotsExpression', () => {
      const newDoc = applyInsertion(this.doc, {
        type: InsertionType.BEFORE,
        path: ['dynamic', 'c'],
        expressions: [this.leafD, this.leafE]
      });

      expect(newDoc).not.toBe(this.doc);
      expect(newDoc.type).toBe(this.doc.type);
      expect(newDoc.getSlotNames()).toEqual(this.doc.getSlotNames());

      const oldDynamic = this.doc.getChild('dynamic');
      const newDynamic = newDoc.getChild('dynamic');
      expect(newDynamic).not.toBe(oldDynamic);
      expect(newDynamic.type).toBe(oldDynamic.type);

      const oldSlots = oldDynamic.getSlotNames();
      const newSlots = newDynamic.getSlotNames();
      expect(oldSlots.length).toBe(3);
      expect(newSlots.length).toBe(5);

      expect(oldDynamic.getChild(oldSlots[0])).toBe(this.leafA);
      expect(newSlots[0]).toBe(oldSlots[0]);
      expect(newDynamic.getChild(newSlots[0])).toBe(this.leafA);

      expect(oldDynamic.getChild(oldSlots[1])).toBe(this.leafB);
      expect(newSlots[1]).toBe(oldSlots[1]);
      expect(newDynamic.getChild(newSlots[1])).toBe(this.leafB);

      // These two were append before 'c' / this.leafC
      expect(newDynamic.getChild(newSlots[2])).toBe(this.leafD);
      expect(newDynamic.getChild(newSlots[3])).toBe(this.leafE);

      // leafC was therefore shifted back two slots
      expect(oldDynamic.getChild(oldSlots[2])).toBe(this.leafC);
      expect(newSlots[4]).toBe(oldSlots[2]);
      expect(newDynamic.getChild(newSlots[4])).toBe(this.leafC);
    });

    it('can insert before the first child', () => {
      const newDoc = applyInsertion(this.doc, {
        type: InsertionType.BEFORE,
        path: ['dynamic', 'a'],
        expressions: [this.leafD]
      });

      const oldDynamic = this.doc.getChild('dynamic');
      const newDynamic = newDoc.getChild('dynamic');

      const oldSlots = oldDynamic.getSlotNames();
      const newSlots = newDynamic.getSlotNames();
      expect(oldSlots.length).toBe(3);
      expect(newSlots.length).toBe(4);

      expect(oldDynamic.getChild(oldSlots[0])).toBe(this.leafA);

      expect(newSlots[1]).toBe(oldSlots[0]);
      expect(newDynamic.getChild(newSlots[0])).toBe(this.leafD);
      expect(newDynamic.getChild(newSlots[1])).toBe(this.leafA);
    });

    it('will throw when the parent of the reference is not a DynamicSlotsExpression', () => {
      expect(() => {
        applyInsertion(this.doc, {
          type: InsertionType.before,
          path: ['fixed', 'a'],
          expressions: [this.leafD]
        })
      }).toThrow();
    });
  });

  describe('with type \'after\'', () => {
    it('will insert expressions after the referenced child of a DynamicSlotsExpression', () => {
      const newDoc = applyInsertion(this.doc, {
        type: InsertionType.AFTER,
        path: ['dynamic', 'b'],
        expressions: [this.leafD, this.leafE]
      });

      expect(newDoc).not.toBe(this.doc);
      expect(newDoc.type).toBe(this.doc.type);
      expect(newDoc.getSlotNames()).toEqual(this.doc.getSlotNames());

      const oldDynamic = this.doc.getChild('dynamic');
      const newDynamic = newDoc.getChild('dynamic');
      expect(newDynamic).not.toBe(oldDynamic);
      expect(newDynamic.type).toBe(oldDynamic.type);

      const oldSlots = oldDynamic.getSlotNames();
      const newSlots = newDynamic.getSlotNames();
      expect(oldSlots.length).toBe(3);
      expect(newSlots.length).toBe(5);

      expect(oldDynamic.getChild(oldSlots[0])).toBe(this.leafA);
      expect(newSlots[0]).toBe(oldSlots[0]);
      expect(newDynamic.getChild(newSlots[0])).toBe(this.leafA);

      expect(oldDynamic.getChild(oldSlots[1])).toBe(this.leafB);
      expect(newSlots[1]).toBe(oldSlots[1]);
      expect(newDynamic.getChild(newSlots[1])).toBe(this.leafB);

      // These two were append after 'b' / this.leafB
      expect(newDynamic.getChild(newSlots[2])).toBe(this.leafD);
      expect(newDynamic.getChild(newSlots[3])).toBe(this.leafE);

      // leafC was therefore shifted back two slots
      expect(oldDynamic.getChild(oldSlots[2])).toBe(this.leafC);
      expect(newSlots[4]).toBe(oldSlots[2]);
      expect(newDynamic.getChild(newSlots[4])).toBe(this.leafC);
    });

    it('can insert after the last child', () => {
      const newDoc = applyInsertion(this.doc, {
        type: InsertionType.AFTER,
        path: ['dynamic', 'c'],
        expressions: [this.leafD, this.leafE]
      });

      const oldDynamic = this.doc.getChild('dynamic');
      const newDynamic = newDoc.getChild('dynamic');

      const oldSlots = oldDynamic.getSlotNames();
      const newSlots = newDynamic.getSlotNames();
      expect(oldSlots.length).toBe(3);
      expect(newSlots.length).toBe(5);

      expect(oldDynamic.getChild(oldSlots[2])).toBe(this.leafC);
      expect(newDynamic.getChild(newSlots[2])).toBe(this.leafC);

      expect(oldDynamic.getChild(oldSlots[3])).toBeNull();
      expect(newDynamic.getChild(newSlots[3])).toBe(this.leafD);

      expect(oldDynamic.getChild(oldSlots[4])).toBeNull();
      expect(newDynamic.getChild(newSlots[4])).toBe(this.leafE);
    });

    it('will throw when the parent of the reference is not a DynamicSlotsExpression', () => {
      expect(() => {
        applyInsertion(this.doc, {
          type: InsertionType.after,
          path: ['fixed', 'a'],
          expressions: [this.leafD]
        })
      }).toThrow();
    });
  });

  describe('with type \'replace\'', () => {
    it('will append the expressions to a DynamicSlotsExpression', () => {
      const newDoc = applyInsertion(this.doc, {
        type: InsertionType.REPLACE,
        path: ['dynamic', 'b'],
        expressions: [this.leafD]
      });

      expect(newDoc).not.toBe(this.doc);
      expect(newDoc.type).toBe(this.doc.type);
      expect(newDoc.getSlotNames()).toEqual(this.doc.getSlotNames());

      const oldDynamic = this.doc.getChild('dynamic');
      const newDynamic = newDoc.getChild('dynamic');
      expect(newDynamic).not.toBe(oldDynamic);
      expect(newDynamic.type).toBe(oldDynamic.type);

      const oldSlots = oldDynamic.getSlotNames();
      const newSlots = newDynamic.getSlotNames();
      expect(oldSlots.length).toBe(3);
      expect(newSlots.length).toBe(3);

      expect(oldDynamic.getChild(oldSlots[0])).toBe(this.leafA);
      expect(newDynamic.getChild(newSlots[0])).toBe(this.leafA);

      expect(oldDynamic.getChild(oldSlots[1])).toBe(this.leafB);
      expect(newDynamic.getChild(newSlots[1])).toBe(this.leafD); // Changed!

      expect(oldDynamic.getChild(oldSlots[2])).toBe(this.leafC);
      expect(newDynamic.getChild(newSlots[2])).toBe(this.leafC);
    });

    it('will throw if there is more than one expression', () => {
      // On a DynamicSlotsExpression
      expect(() => {
        applyInsertion(this.doc, {
          type: InsertionType.replace,
          path: ['dynamic', 'c'],
          expressions: [this.leafD, this.leafE]
        });
      }).toThrow();

      // On a FixedSlotsExpression
      expect(() => {
        applyInsertion(this.doc, {
          type: InsertionType.replace,
          path: ['fixed', 'c'],
          expressions: [this.leafD, this.leafE]
        });
      }).toThrow();
    });
  });
});
