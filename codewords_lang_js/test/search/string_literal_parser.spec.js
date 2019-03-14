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

describe('CodeWordsJS.Search.matchStringLiteral', function() {
  beforeEach(() => {
    // Construct the SnippetContext so that any change attempts will throw.
    // The match functions should only use the language reference, anyway.
    const astDoc = CodeWordsJS.ES6.newExpression('DOCUMENT');
    astDoc.freeze();
    this.context = {
      astDoc
    };

    this.parser = new CodeWordsJS.Search.StringLiteralParser();
  });

  it('matches \'abc\' (single quoted) with result: \'abc\'', () => {
    const input = '\'abc\'';
    const output = {
      inputEnd: 5,
      mayContinue: false,
      value:'abc',
      quotedAndEscaped: '\'abc\''
    };
    this.testInputOutputsInOneShot(input, [output]);
    this.testInputOutputsIteratively(input, [output]);
  });

  it('matches \'abc \' (single quoted) with result: \'abc \'', () => {
    const input = '\'abc \'';
    const output = {
      inputEnd: 6,
      mayContinue: false,
      value:'abc ',
      quotedAndEscaped: '\'abc \''
    };
    this.testInputOutputsInOneShot(input, [output]);
    this.testInputOutputsIteratively(input, [output]);
  });

  it('matches \"abc\" (double quoted) with result: \"abc\"', () => {
    const input = '\"abc\"';
    const output = {
      inputEnd: 5,
      mayContinue: false,
      value:'abc',
      quotedAndEscaped: '\"abc\"'
    };
    this.testInputOutputsInOneShot(input, [output]);
    this.testInputOutputsIteratively(input, [output]);
  });

  it('matches \"abc \" (double quoted) with result: \"abc \"', () => {
    const input = '\"abc \"';
    const output = {
      inputEnd: 6,
      mayContinue: false,
      value:'abc ',
      quotedAndEscaped: '\"abc \"'
    };
    this.testInputOutputsInOneShot(input, [output]);
    this.testInputOutputsIteratively(input, [output]);
  });

  it('matches \'abc\' (unquoted) with result: \'abc\'', () => {
    const input = 'abc';
    const output = {
      inputEnd: 3,
      mayContinue: true,
      value:'abc',
      quotedAndEscaped: '\'abc\''
    };
    this.testInputOutputsInOneShot(input, [output]);
    this.testInputOutputsIteratively(input, [output]);
  });

  it('matches \'123\' (unquoted) with result: 123', () => {
    const input = '123';
    const output = {
      inputEnd: 3,
      mayContinue: true,
      value:'123',
      quotedAndEscaped: '\'123\''
    };
    this.testInputOutputsInOneShot(input, [output]);
    this.testInputOutputsIteratively(input, [output]);
  });

  it('matches \'abc \' (unquoted) with result: \'abc\' and unresolved continuation', () => {
    const input = 'abc ';
    const outputs = [{
      inputEnd: 3,
      mayContinue: false,
      value:'abc',
      quotedAndEscaped: '\'abc\''
    }, {
      inputEnd: 4,
      mayContinue: true
    }];
    this.testInputOutputsInOneShot(input, outputs);
    this.testInputOutputsIteratively(input, outputs);
  });

  it('matches \'abc def\' (unquoted) with results: \'abc\' and \'abc def\'', () => {
    const input = 'abc def';
    const outputs = [{
      inputEnd: 3,
      mayContinue: false,
      value: 'abc',
      quotedAndEscaped: '\'abc\''
    }, {
      inputEnd: 7,
      mayContinue: true,
      value:'abc def',
      quotedAndEscaped: '\'abc def\''
    }];
    this.testInputOutputsInOneShot(input, outputs);
    this.testInputOutputsIteratively(input, outputs);
  });

  it('matches \'who\'d\'ve thunk\' (unquoted) with results: \'who\\\'d\\\'ve\' \'who\\\'d\\\'ve thunk\'', () => {
    const input = 'who\'d\'ve thunk';
    const outputs = [{
      inputEnd: 8,
      mayContinue: false,
      value: 'who\'d\'ve',
      quotedAndEscaped: '\'who\\\'d\\\'ve\''
    }, {
      inputEnd: 14,
      mayContinue: true,
      value: 'who\'d\'ve thunk',
      quotedAndEscaped: '\'who\\\'d\\\'ve thunk\''
    }];
    this.testInputOutputsInOneShot(input, outputs);
    this.testInputOutputsIteratively(input, outputs);
  });

  /**
   * Test the provided input without a prior PendingParse, expecting the
   * provided outputs. The input is the raw searchText input. The outputs is
   * and array of objects (one per resulting PendingParse) with the properties:
   *
   *  - inputEnd: index of the input after the processed input characters.
   *  - value: the string value of the resulting StringLiteralExpression.
   *  - quotedAndEscaped: the code string for the StringLiteralExpression.
   */
  this.testInputOutputsInOneShot = function(input, expectedOutputs) {
    this.context.searchText = input;
    const pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    expect(pendingParses.length).toBe(expectedOutputs.length);

    // TODO: Fix assumption that the outputs are in the same order as the results.

    let i = 0;
    for (; i < pendingParses.length; ++i) {
      const parse = pendingParses[i];
      const outputSpec = expectedOutputs[i];

      expect(parse.inputEnd).toEqual(outputSpec.inputEnd);
      expect(parse.mayContinue).toEqual(outputSpec.mayContinue);

      const expr = parse.getExpression();  // StringLiteralExpression
      if (outputSpec.value !== undefined) {
        expect(expr).toBeDefined();
        expect(expr.value).toEqual(outputSpec.value);
        expect(expr.quotedAndEscaped).toEqual(outputSpec.quotedAndEscaped);
      } else {
        expect(expr).toBeUndefined();
      }
    }
    for (; i < expectedOutputs.length; ++i) {
      // Hacky descriptive failure for missing result.
      expect('Missing PendingParse').toEqual(expectedOutputs[i]);
    }
  };

  /**
   * Test the provided input without a prior PendingParse, expecting the
   * provided outputs. The input is the raw searchText input. The outputs is
   * and array of objects (one per resulting PendingParse) with the properties:
   *
   *  - inputEnd: index of the input after the processed input characters.
   *  - value: the string value of the resulting StringLiteralExpression.
   *  - quotedAndEscaped: the code string for the StringLiteralExpression.
   */
  this.testInputOutputsIteratively = function(input, expectedOutputs) {
    this.context.searchText = input[0];
    let pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    const completedParses = [];

    // Iterate over each character for each remaining PendingParse
    for(let n = 1; n < input.length;) {
      this.context.searchText += input[n];
      const newParses = [];
      for(const prevParse of pendingParses) {
        newParses.push(...this.parser.attemptParse(this.context, 0, prevParse));
      }

      ++n; // Compared to the character after last evaluated.

      let i = 0;
      while (i < newParses.length) {
        const newParse = newParses[0];
        if (newParse.mayContinue) {
          ++i;
        } else {
          completedParses.push(newParse);
          newParses.splice(i, 1);
        }
      }
      pendingParses = newParses;
    }
    completedParses.push(...pendingParses);
    expect(completedParses.length).toBe(expectedOutputs.length);

    // TODO: Fix assumption that the outputs are in the same order as the results.

    let i = 0;
    for (; i < completedParses.length; ++i) {
      const parse = completedParses[i];
      const outputSpec = expectedOutputs[i];

      expect(parse.inputEnd).toEqual(outputSpec.inputEnd);

      const expr = parse.getExpression();  // StringLiteralExpression
      if (outputSpec.value !== undefined) {
        expect(expr).toBeDefined();
        expect(expr.value).toEqual(outputSpec.value);
        expect(expr.quotedAndEscaped).toEqual(outputSpec.quotedAndEscaped);
      } else {
        expect(expr).toBeUndefined();
      }
    }
    for (; i < expectedOutputs.length; ++i) {
      // Hacky descriptive failure for missing result.
      expect('Missing PendingParse').toEqual(expectedOutputs[i]);
    }
  }
});