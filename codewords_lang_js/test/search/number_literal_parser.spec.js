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

describe('CodeWordsJS.Search.matchNumberLiteral', function() {
  const NumberLiteralParser = CodeWordsJS.Search.NumberLiteralParser;

  beforeEach(() => {
    // Construct the SnippetContext so that any change attempts will throw.
    // The match functions should only use the language reference, anyway.
    const astDoc = CodeWordsJS.ES6.newExpression('DOCUMENT');
    astDoc.freeze();
    this.context = {
      astDoc
    };
    this.parser = new NumberLiteralParser();
  });

  // Numerous string literals, where the input is the codeString.
  for (const input of [
    '123', '123.456', '.123', '0.123',
    '+123', '+123.456', '+.123', '+0.123',
    '-123', '-123.456', '-.123', '-0.123'
  ]) {
    it(`can match '${input} as NumberLiteralExpression ${input} and NumberValueSnippet`, () => {
      this.context.searchText = input;
      const pendingParses = this.parser.attemptParse(this.context, 0, undefined);

      expect(pendingParses.length).toBe(1);
      const pendingParse = pendingParses[0];

      expect(pendingParse.input).toBe(this.context.searchText);
      expect(pendingParse.inputStart).toBe(0);
      expect(pendingParse.inputEnd).toBe(input.length);

      const expr = pendingParse.getExpression();
      expect(expr.language).toBe(this.context.astDoc.language);
      expect(expr.type).toBe(CodeWordsJS.NUMBER_LITERAL);
      expect(expr).toEqual(jasmine.any(CodeWordsJS.NumberLiteralExpression));
      expect(expr.codeString).toEqual(input);
      expect(expr.value).toEqual(Number(input));

      const snippet = pendingParse.getSnippet();
      expect(snippet).toEqual(jasmine.any(CodeWordsJS.Snippet.NumberValueSnippet));
    });

    it(`can match '${input} as literal ${input} with other text`, () => {
      this.context.searchText = `ignore ${input} ignore`;
      const pendingParses = this.parser.attemptParse(this.context, 7, undefined);

      expect(pendingParses.length).toBe(1);
      const pendingParse = pendingParses[0];

      expect(pendingParse.input).toBe(this.context.searchText);
      expect(pendingParse.inputStart).toBe(7);
      expect(pendingParse.inputEnd).toBe(7 + input.length);

      const expr = pendingParse.getExpression();
      expect(expr.language).toBe(this.context.astDoc.language);
      expect(expr.type).toBe(CodeWordsJS.NUMBER_LITERAL);
      expect(expr).toEqual(jasmine.any(CodeWordsJS.NumberLiteralExpression));
      expect(expr.codeString).toEqual(input);
      expect(expr.value).toEqual(Number(input));
    });
  }

  it('can (by default) match \'infinity\' and create a NumberLiteralExpression', () => {
    this.context.searchText = 'infinity ignored';
    const pendingParses = this.parser.attemptParse(this.context, 0, undefined);

    expect(pendingParses.length).toBe(1);
    const pendingParse = pendingParses[0];

    expect(pendingParse.input).toBe(this.context.searchText);
    expect(pendingParse.inputStart).toBe(0);
    expect(pendingParse.inputEnd).toBe(8);

    const expr = pendingParse.getExpression();
    expect(expr.language).toBe(this.context.astDoc.language);
    expect(expr.type).toBe(CodeWordsJS.NUMBER_LITERAL);
    expect(expr).toEqual(jasmine.any(CodeWordsJS.NumberLiteralExpression));
    expect(expr.value).toEqual(Infinity);
    expect(expr.codeString).toEqual('Infinity');

    const snippet = pendingParse.getSnippet();
    expect(snippet).toEqual(jasmine.any(CodeWordsJS.Snippet.NumberValueSnippet));
  });

  it('can (by default) match \'NaN\' and create a NumberLiteralExpression', () => {
    this.context.searchText = 'nan ignored';
    const pendingParses = this.parser.attemptParse(this.context, 0, undefined);

    expect(pendingParses.length).toBe(1);
    const pendingParse = pendingParses[0];

    expect(pendingParse.input).toBe(this.context.searchText);
    expect(pendingParse.inputStart).toBe(0);
    expect(pendingParse.inputEnd).toBe(3);

    const expr = pendingParse.getExpression();
    expect(expr.language).toBe(this.context.astDoc.language);
    expect(expr.type).toBe(CodeWordsJS.NUMBER_LITERAL);
    expect(expr).toEqual(jasmine.any(CodeWordsJS.NumberLiteralExpression));
    expect(expr.value).toEqual(NaN);
    expect(expr.codeString).toEqual('NaN');

    const snippet = pendingParse.getSnippet();
    expect(snippet).toEqual(jasmine.any(CodeWordsJS.Snippet.NumberValueSnippet));
  });

  it('potential parse, but no match on empty string', () => {
    this.context.searchText = '';
    const pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    expect(pendingParses.length).toBe(1);

    const pendingParse = pendingParses[0];
    expect(pendingParse.input).toBe(this.context.searchText);
    expect(pendingParse.inputStart).toBe(0);
    expect(pendingParse.inputEnd).toBe(0);

    expect(pendingParse.getExpression()).toBeUndefined();
    expect(pendingParse.getSnippet()).toBeUndefined();
  });

  it('potential parse, but no match on initial sign', () => {
    this.context.searchText = '+';
    let pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    expect(pendingParses.length).toBe(1);

    const pendingPlus = pendingParses[0];
    expect(pendingPlus.input).toBe(this.context.searchText);
    expect(pendingPlus.inputStart).toBe(0);
    expect(pendingPlus.inputEnd).toBe(1);

    expect(pendingPlus.getExpression()).toBeUndefined();
    expect(pendingPlus.getSnippet()).toBeUndefined();

    this.context.searchText = '-';
    pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    expect(pendingParses.length).toBe(1);

    const pendingMinus = pendingParses[0];
    expect(pendingMinus.input).toBe(this.context.searchText);
    expect(pendingMinus.inputStart).toBe(0);
    expect(pendingMinus.inputEnd).toBe(1);

    expect(pendingMinus.getExpression()).toBeUndefined();
    expect(pendingMinus.getSnippet()).toBeUndefined();
  });

  it('potential parse, but no match on initial decimal point', () => {
    this.context.searchText = '.';
    const pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    expect(pendingParses.length).toBe(1);

    const pendingParse = pendingParses[0];
    expect(pendingParse.input).toBe(this.context.searchText);
    expect(pendingParse.inputStart).toBe(0);
    expect(pendingParse.inputEnd).toBe(1);

    expect(pendingParse.getExpression()).toBeUndefined();
    expect(pendingParse.getSnippet()).toBeUndefined();
  });

  for(const [sign, signedValue] of [['+', +Infinity], ['-', -Infinity]]) {
    for(const i of ['I', 'i']) {
      it(`matches the ${sign}Infinity if the ${sign} is followed by an \'${i}\'`, () => {
        this.context.searchText = sign;
        const firstParses = this.parser.attemptParse(this.context, 0, undefined);
        expect(firstParses.length).toBe(1);

        this.context.searchText = sign + i;
        const secondParses = this.parser.attemptParse(this.context, 0, firstParses[0]);
        expect(secondParses.length).toBe(1);
        const secondParse = secondParses[0];
        const expr = secondParse.getExpression();
        expect(expr).toEqual(jasmine.any(CodeWordsJS.NumberLiteralExpression));
        expect(expr.value).toEqual(signedValue);
        expect(expr.codeString).toEqual(sign + 'Infinity');
      });
    }
  }

  for (const [follow, description] of [
    [' ', 'a space'],
    ['a', 'a letter'],
    ['N', 'a letter \'N\''] // NaN does not have a sign.
  ]) {
    it('does not match the when the \'+\' is followed by ' + description, () => {
      this.context.searchText = '+';
      const firstParses = this.parser.attemptParse(this.context, 0, undefined);
      expect(firstParses.length).toBe(1);

      this.context.searchText = '+' +  follow;
      const secondParses = this.parser.attemptParse(this.context, 0, firstParses[0]);
      expect(secondParses.length).toBe(0);
    });

    it('does not match the when the \'-\' is followed by ' + description, () => {
      this.context.searchText = '-';
      const firstParses = this.parser.attemptParse(this.context, 0, undefined);
      expect(firstParses.length).toBe(1);

      this.context.searchText = '-' +  follow;
      const secondParses = this.parser.attemptParse(this.context, 0, firstParses[0]);
      expect(secondParses.length).toBe(0);
    });

    it('does not match the when the \'.\' is followed by ' + description, () => {
      this.context.searchText = '.';
      const firstParses = this.parser.attemptParse(this.context, 0, undefined);
      expect(firstParses.length).toBe(1);

      this.context.searchText = '.' +  follow;
      const secondParses = this.parser.attemptParse(this.context, 0, firstParses[0]);
      expect(secondParses.length).toBe(0);
    });
  }

  it('matches \'I\' as \'Infinity\'', () => {
    const input = 'I';
    const outputSpec = {
      inputEnd: 1,
      value: Infinity,
      codeString: 'Infinity',
      mayContinue: true
    };
    this.testInputOutputsInOneShot(input, outputSpec);
  });

  it('matches \'i\' as \'Infinity\'', () => {
    const input = 'i';
    const outputSpec = {
      inputEnd: 1,
      value: Infinity,
      codeString: 'Infinity',
      mayContinue: true
    };
    this.testInputOutputsInOneShot(input, outputSpec);
  });

  it('matches \'+I\' as \'Infinity\'', () => {
    const input = '+I';
    const outputSpec = {
      inputEnd: 2,
      value: +Infinity,
      codeString: '+Infinity',
      mayContinue: true
    };
    this.testInputOutputsInOneShot(input, outputSpec);
  });

  it('matches \'-I\' as \'Infinity\'', () => {
    const input = '-I';
    const outputSpec = {
      inputEnd: 2,
      value: -Infinity,
      codeString: '-Infinity',
      mayContinue: true
    };
    this.testInputOutputsInOneShot(input, outputSpec);
  });

  it('matches \'N\' as \'NaN\'', () => {
    const input = 'N';
    const outputSpec = {
      inputEnd: 1,
      value: undefined,
      codeString: undefined,
      mayContinue: true
    };
    this.testInputOutputsInOneShot(input, outputSpec);
  });

  it('matches \'nan\' as \'NaN\'', () => {
    const input = 'nan';
    const outputSpec = {
      inputEnd: 3,
      value: NaN,
      codeString: 'NaN',
      mayContinue: false
    };
    this.testInputOutputsInOneShot(input, outputSpec);
  });

  describe('with Infinity and NaN disabled', () => {
    beforeEach(() => {
      this.simpleParser = new NumberLiteralParser({
        allowInfinity: false,
        allowNaN: false
      });
    });

    for (const input of ['I', 'i', '+I', '-I', 'N']) {
      it(`does not match '${input}'`, () => {
        this.context.searchText = input;
        const pendingParses = this.simpleParser.attemptParse(this.context, 0, undefined);
        expect(pendingParses.length).toBe(0);
      });
    }
  });

  /**
   * Test the provided input without a prior PendingParse, expecting the
   * provided outputs. The input is the raw searchText input. The outputs is
   * an object (for one resulting PendingParse) with the properties:
   *
   *  - inputEnd: index of the input after the processed input characters.
   *  - value: the number value of the resulting NumberLiteralExpression.
   *  - codeString: the code string for the NumberLiteralExpression.
   *  - mayContinue: whether the output is expected to be continuable.
   */
  this.testInputOutputsInOneShot = function(input, outputSpec) {
    this.context.searchText = input;
    const pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    expect(pendingParses.length).toBe(1);

    const parse = pendingParses[0];

    expect(parse.input).toBe(input);
    expect(parse.inputStart).toBe(0);
    expect(parse.inputEnd).toEqual(outputSpec.inputEnd);

    const expr = parse.getExpression();  // NumberLiteralExpression
    if (outputSpec.value !== undefined) {
      expect(expr).toBeDefined();
      expect(expr.language).toBe(this.context.astDoc.language);
      expect(expr.type).toBe(CodeWordsJS.NUMBER_LITERAL);
      expect(expr).toEqual(jasmine.any(CodeWordsJS.NumberLiteralExpression));
      expect(expr.value).toEqual(outputSpec.value);
      expect(expr.codeString).toEqual(outputSpec.codeString);
    } else {
      expect(expr).toBeUndefined();
    }
  };
});