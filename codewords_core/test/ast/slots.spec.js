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

describe('CodeWords.AST.isSlotNameValid(slotName: string)', function() {
  const isSlotNameValid = CodeWords.AST.isSlotNameValid;

  it('to throw when the slot name is not a string', () => {
    expect(function() {
      isSlotNameValid(undefined);
    }).toThrow();
    expect(function() {
      isSlotNameValid(null);
    }).toThrow();
    expect(function() {
      isSlotNameValid(123);
    }).toThrow();
    expect(function() {
      isSlotNameValid({});
    }).toThrow();
  });

  it('return false when the slot name is empty', () => {
    expect(isSlotNameValid('')).toBeFalsy();
  });

  it('return true when the slot name is alphanumeric and underscores', () => {
    expect(isSlotNameValid('ABC')).toBe(true);
    expect(isSlotNameValid('XYZ')).toBe(true);
    expect(isSlotNameValid('abc')).toBe(true);
    expect(isSlotNameValid('xyz')).toBe(true);
    expect(isSlotNameValid('123')).toBe(true);
    expect(isSlotNameValid('456')).toBe(true);

    expect(isSlotNameValid('slot1')).toBe(true);
    expect(isSlotNameValid('1slot')).toBe(true);

    expect(isSlotNameValid('example_slot')).toBe(true);
    expect(isSlotNameValid('001_line_number')).toBe(true);
    expect(isSlotNameValid('_')).toBe(true);  // Questionable, but...
  });

  it('return false for non-alphanumeric characters', () => {
    expect(isSlotNameValid('example slot name')).toBe(false);
    expect(isSlotNameValid('example-slot-name')).toBe(false);

    expect(isSlotNameValid(' ')).toBe(false);
    expect(isSlotNameValid('\t')).toBe(false);
    expect(isSlotNameValid('\r')).toBe(false);
    expect(isSlotNameValid('\n')).toBe(false);

    expect(isSlotNameValid('-')).toBe(false);
    expect(isSlotNameValid('/')).toBe(false);
    expect(isSlotNameValid('\\')).toBe(false);
    expect(isSlotNameValid('\"')).toBe(false);
    expect(isSlotNameValid('\'')).toBe(false);
    expect(isSlotNameValid('|')).toBe(false);

    expect(isSlotNameValid('`aa')).toBe(false);
    expect(isSlotNameValid('b~b')).toBe(false);
    expect(isSlotNameValid('cc!')).toBe(false);
    expect(isSlotNameValid('@dd')).toBe(false);
    expect(isSlotNameValid('e#e')).toBe(false);
    expect(isSlotNameValid('ff$')).toBe(false);
    expect(isSlotNameValid('%gg')).toBe(false);
    expect(isSlotNameValid('h^h')).toBe(false);
    expect(isSlotNameValid('ii&')).toBe(false);
    expect(isSlotNameValid('*jj')).toBe(false);
    expect(isSlotNameValid('k(k')).toBe(false);
    expect(isSlotNameValid('ll)')).toBe(false);
    expect(isSlotNameValid('=mm')).toBe(false);
    expect(isSlotNameValid('n+n')).toBe(false);
    expect(isSlotNameValid('oo;')).toBe(false);
    expect(isSlotNameValid(':pp')).toBe(false);
  });
});

describe('CodeWords.AST.validateSlotNames(names: string[])', function() {
  const validateSlotNames = CodeWords.AST.validateSlotNames;

  beforeEach(() => {
    spyOn(CodeWords.AST, 'isSlotNameValid').and.callThrough();
  });

  it('calls to isSlotNameValid(..) to validate each name.', () => {
    const SLOT1 = 'SLOT1';
    const SLOT2 = 'SLOT2';

    validateSlotNames([SLOT1, SLOT2]);
    expect(CodeWords.AST.isSlotNameValid).toHaveBeenCalledTimes(2);
    expect(CodeWords.AST.isSlotNameValid).toHaveBeenCalledWith(SLOT1);
    expect(CodeWords.AST.isSlotNameValid).toHaveBeenCalledWith(SLOT2);
  });
});

describe('CodeWords.AST.validateSlotValue(..)', function() {
  // Type & function aliases
  const CodeLanguage = CodeWords.CodeLanguage;
  const ExpressionType = CodeWords.AST.ExpressionType;
  const LeafExpression = CodeWords.AST.LeafExpression;
  const validateSlotValue = CodeWords.AST.validateSlotValue;

  let TYPE_A, TYPE_B, TYPE_C, EXAMPLE_TYPES, EXAMPLE_LANG, OTHER_LANG, TEST_EXPR;
  beforeEach(() => {
    TYPE_A = new ExpressionType('a', LeafExpression);
    TYPE_B = new ExpressionType('b', LeafExpression);
    TYPE_C = new ExpressionType('c', LeafExpression);

    EXAMPLE_TYPES = [TYPE_A, TYPE_B, TYPE_C];
    EXAMPLE_LANG = new CodeLanguage('EXAMPLE_LANG', EXAMPLE_TYPES);
    OTHER_LANG = new CodeLanguage('OTHER_LANG', EXAMPLE_TYPES);

    TEST_EXPR = new LeafExpression(EXAMPLE_LANG, TYPE_A);
  });

  it('returns normally when it receives a null or undefined', () => {
    validateSlotValue(null, EXAMPLE_LANG);
    validateSlotValue(undefined, EXAMPLE_LANG);
  });

  it('throws when the language is missing or doesn\'t match', () => {
    expect(function () {
      validateSlotValue(TEST_EXPR, OTHER_LANG);
    }).toThrow();

    expect(function () {
      validateSlotValue(TEST_EXPR, null);
    }).toThrow();
  });
});