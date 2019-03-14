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

describe('CodeWordJS.Search.CallParametersParser', function() {
  const ES6 = CodeWordsJS.ES6;
  const STRING_LITERAL = CodeWordsJS.STRING_LITERAL;

  const SEARCH_PARAM_1 = 'SEARCH_PARAM_1';
  const SEARCH_PARAM_2 = 'SEARCH_PARAM_2';

  const AUTO_PARAM_1 = 'AUTO_PARAM_1';
  const AUTO_PARAM_2 = 'AUTO_PARAM_2';

  const AUTO_EXPR_1 = CodeWordsJS.ES6.stringLiteral(AUTO_PARAM_1);
  const AUTO_EXPR_2 = CodeWordsJS.ES6.stringLiteral(AUTO_PARAM_2);

  const NO_ARGUMENTS_NO_AUTOCOMPLETION = {
    args: [],
    autocompletions: []
  };
  const TWO_ARGUMENTS_WITH_AUTOCOMPLETION = {
    args: [STRING_LITERAL, STRING_LITERAL],
    autocompletions: [{
      args: [AUTO_EXPR_1, AUTO_EXPR_2]
    }]
  };

  beforeEach(() => {
    // Construct the SnippetContext so that any change attempts will throw.
    // The match functions should only use the language reference, anyway.
    const astDoc = ES6.newExpression('DOCUMENT');
    astDoc.freeze();
    this.context = {
      astDoc
    };

    this.parser = new CodeWordsJS.Search.CallParametersParser();
  });

  it('aborts if there is no FunctionSpec', () => {
    // Mock
    this.context.delegateSubParse = (optSubcontext, substringStart, callback) => {
      throw new Error('Delegate should not be called.');
    };
    this.context.fnSpec = undefined;

    this.testInputOutputsInOneShot('()', [ /* no match */ ]);
    this.testInputOutputsInOneShot('(123)', [ /* no match */ ]);
    this.testInputOutputsInOneShot('(string)', [ /* no match */ ]);
  });

  it('matches NO_ARGUMENT fn with an empty string. Provides only the empty argument completion.', () => {
    const text = '';
    this.context.fnSpec = NO_ARGUMENTS_NO_AUTOCOMPLETION;
    const output = {
      inputEnd: 0,
      mayContinue: true,
      resultParameters: []
    };
    // Mock
    this.context.delegateSubParse = (optSubcontext, substringStart, callback) => {
      throw new Error('Delegate should not be called.');
    };

    this.testInputOutputsInOneShot(text, [output]);
  });

  it('matches NO_ARGUMENT fn with \'(\'. Provides only the empty argument completion.', () => {
    const text = '(';
    this.context.fnSpec = NO_ARGUMENTS_NO_AUTOCOMPLETION;
    const output = {
      inputEnd: 1,
      mayContinue: true,
      resultParameters: []
    };
    const mockDelegateSubParse = (optSubcontext, substringStart, callback) => {
      throw new Error('Delegate should not be called.');
    };

    this.testInputOutputsInOneShot(text, [output]);
  });


  it('matches NO_ARGUMENT fn with \'()\'. Provides only the empty argument completion.', () => {
    const text = '()';
    this.context.fnSpec = NO_ARGUMENTS_NO_AUTOCOMPLETION;
    const output = {
      inputEnd: 2,
      resultParameters: [],
      mayContinue: false
    };
    const mockDelegateSubParse = (optSubcontext, substringStart, callback) => {
      throw new Error('Delegate should not be called.');
    };

    this.testInputOutputsInOneShot(text, [output]);
    // TODO: this.testInputOutputsIteratively(text, [output]);
  });

  it('matches \'  (  )\' with empty arguments. Provides only the empty argument completion.', () => {
    const text = '  (  )';
    this.context.fnSpec = NO_ARGUMENTS_NO_AUTOCOMPLETION;
    const output = {
      inputEnd: 6,
      resultParameters: [],
      mayContinue: false
    };
    const mockDelegateSubParse = (optSubcontext, substringStart, callback) => {
      throw new Error('Delegate should not be called.');
    };

    this.testInputOutputsInOneShot(text, [output]);
    // TODO: this.testInputOutputsIteratively(text, [output]);
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
  this.testInputOutputsInOneShot = function(inputText, expectedOutputs) {
    this.context.searchText = inputText;

    const pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    expect(pendingParses.length).toBe(expectedOutputs.length);

    // TODO: Fix assumption that the outputs are in the same order as the results.

    let i = 0;
    for (; i < pendingParses.length; ++i) {
      const parse = pendingParses[i];
      const outputSpec = expectedOutputs[i];

      expect(parse.inputEnd).toEqual(outputSpec.inputEnd);
      expect(parse.mayContinue).toEqual(outputSpec.mayContinue);

      const expr = parse.getExpression();  // CALL_PARAMETERS Expression
      if (outputSpec.resultParameters !== undefined) {
        expect(expr).toBeDefined();
        expect(expr.type).toEqual(CodeWordsJS.CALL_PARAMETERS);

        const exprParams = expr.getChildren();
        for (let i = 0; i < exprParams.length; ++i) {
          const param = exprParams[i];
          const expectedParam = outputSpec.resultParameters[i];

          // Only supports testing with literal expressions right now.
          expect(param.type).toEqual(expectedParam.type);
          expect(param.value).toEqual(expectedParam.value);
        }
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
  this.testInputOutputsIteratively = function(inputText, expectedOutputs) {
    this.context.searchText = inputText[0];

    let pendingParses = this.parser.attemptParse(this.context, 0, undefined);
    const completedParses = [];

    // Iterate over each character for each remaining PendingParse
    for(let n = 1; n < inputText.length;) {
      this.context.searchText += inputText[n];
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
      expect(parse.mayContinue).toEqual(outputSpec.mayContinue);

      const expr = parse.getExpression();  // CALL_PARAMETERS Expression
      if (outputSpec.resultParameters !== undefined) {
        expect(expr).toBeDefined();
        expect(expr.type).toEqual(CodeWordsJS.CALL_PARAMETERS);

        const exprParams = expr.getChildren();
        for (let i = 0; i < exprParams.length; ++i) {
          const param = exprParams[i];
          const expectedParam = outputSpec.resultParameters[i];

          // Only supports testing with literal expressions right now.
          expect(param.type).toEqual(expectedParam.type);
          expect(param.value).toEqual(expectedParam.value);
        }
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