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

describe('CodeWords.CodeLanguage', function() {
  const CodeLanguage = CodeWords.CodeLanguage;
  const ExpressionType = CodeWords.AST.ExpressionType;
  const LeafExpression = CodeWords.AST.LeafExpression;

  const NAME = 'TestLanguage';

  let TYPE_A, TYPE_B, TYPE_C, EXAMPLE_TYPES;
  beforeEach(() => {
    TYPE_A = new ExpressionType('a', LeafExpression);
    TYPE_B = new ExpressionType('b', LeafExpression);
    TYPE_C = new ExpressionType('c', LeafExpression);

    EXAMPLE_TYPES = [TYPE_A, TYPE_B, TYPE_C];
  });

  describe('constructor', () => {
    it('expects a name and an array of ExpressionTypes',
        () => {
          // Good / control:
          new CodeLanguage(NAME, EXAMPLE_TYPES);
        });

    describe('constructor', () => {
      it('throws if the first argument is not a string', () => {
        // Bad:
        expect(() => {
          new CodeLanguage(undefined, [TYPE_A]);
        }).toThrowError();

        expect(() => {
          new CodeLanguage(123, [TYPE_A]);
        }).toThrowError();

        expect(() => {
          new CodeLanguage({an: 'object'}, [TYPE_A]);
        }).toThrowError();

        expect(() => {
          new CodeLanguage(['array'], [TYPE_A]);
        }).toThrowError();
      });
    });

    describe('constructor', () => {
      it('throws if the second argument is not an array of ExpressionTypes', () => {
        // Bad:
        expect(() => {
          new CodeLanguage(NAME, undefined);
        }).toThrowError();

        expect(() => {
          new CodeLanguage(NAME, 'string');
        }).toThrowError();

        expect(() => {
          new CodeLanguage(NAME, 123);
        }).toThrowError();

        expect(() => {
          new CodeLanguage(NAME, {an: 'object'});
        }).toThrowError();

        expect(() => {
          new CodeLanguage(NAME, ['a', 'b', 'c']);
        }).toThrowError();
      });
    });

    it('throws there are duplicate type ids', () => {
      expect(() => {
        new CodeLanguage(NAME, [TYPE_A, TYPE_A, TYPE_C]);
      }).toThrowError();

      expect(() => {
        new CodeLanguage(NAME, [TYPE_A, TYPE_B, TYPE_B]);
      }).toThrowError();

      expect(() => {
        new CodeLanguage(NAME, [TYPE_A, TYPE_B, TYPE_A]);
      }).toThrowError();
    });

    it('takes a second parameter that allows additional initialization before freezing', () => {
      let initializerCalled = false;
      let lang = new CodeLanguage(NAME, EXAMPLE_TYPES, function() {
        initializerCalled = true;

        expect(this instanceof CodeLanguage).toBe(true);

        // Types passed in are assigned before the initializer.
        expect(Object.keys(this.types).length).toEqual(3);

        this.types['d'] = new ExpressionType('d', LeafExpression);
        this.newProp = true;
      });

      expect(initializerCalled).toBe(true);

      expect(Object.keys(lang.types).length).toEqual(4);
      expect(lang.newProp).toBe(true);

      // Test it cannot be modified further...
      expect(() => {
        lang.types['not allowed'] = new ExpressionType('no good', LeafExpression);
      }).toThrow();

      expect(() => {
        lang['newProp'] = true;
        if (lang.newProp) {
          throw new Error();
        }
      }).toThrow();
    });

    it('the initializer\'s first argument refers to the CodeLanguage, ' +
        'which is useful for lambdas where this is bound to the declaration scope.', () => {
      let initializerCalled = false;
      new CodeLanguage(NAME, EXAMPLE_TYPES, (lang) => {
        initializerCalled = true;
        expect(lang instanceof CodeLanguage).toBe(true);
      });
      expect(initializerCalled).toBe(true);
    });

    it('will validate all type names after the initializer is called', () => {
      // Create the spy after the types have been constructed.
      let spy = spyOn(CodeWords.AST.ExpressionType, 'validateName');

      let lang = new CodeLanguage(NAME, EXAMPLE_TYPES, function() {
        expect(spy).not.toHaveBeenCalled();
        this.types['another'] = new ExpressionType('another', LeafExpression);
      });

      expect(spy).toHaveBeenCalledWith('a');
      expect(spy).toHaveBeenCalledWith('b');
      expect(spy).toHaveBeenCalledWith('c');
      expect(spy).toHaveBeenCalledWith('another');
    });

    it('will validate all type names map to ExpressionTypes', () => {
      expect(() => {
        let lang = new CodeLanguage(NAME, [TYPE_A, TYPE_B, TYPE_C], function() {
          this.types['another'] = "Not an ExressionType";
        });
      }).toThrow();
    });
  });

  describe('object', () => {
    it('is immutable', ()=> {
      let lang = new CodeLanguage(NAME, EXAMPLE_TYPES);

      expect(function() {
        lang.types['bad'] = new ExpressionType('bad', LeafExpression)
      }).toThrow();

      expect(function() {
        lang['newProp'] = true;
        if (lang.newProp) {
          throw new Error();
        }
      }).toThrow();
    });
  });
});
