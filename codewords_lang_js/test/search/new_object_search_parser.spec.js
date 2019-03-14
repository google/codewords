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

describe('CodeWordJS.Search.NewObjectSearchParser', function() {
  const ES6 = CodeWordsJS.ES6;
  const IdentifierExpression = CodeWordsJS.IdentifierExpression;
  const JsValueType = CodeWordsJS.Value.JsValueType;
  const JsValueTypeFlags = CodeWordsJS.Value.JsValueTypeFlags;

  const CALL_PARAMETERS = CodeWordsJS.CALL_PARAMETERS;
  const IDENTIFIER = CodeWordsJS.IDENTIFIER;
  const STRING_LITERAL = CodeWordsJS.STRING_LITERAL;

  const SEARCH_PARAM_1 = 'SEARCH_PARAM_1';
  const SEARCH_PARAM_2 = 'SEARCH_PARAM_2';

  const AUTO_PARAM_1 = 'AUTO_PARAM_1';
  const AUTO_PARAM_2 = 'AUTO_PARAM_2';

  const AUTO_EXPR_1 = CodeWordsJS.ES6.stringLiteral(AUTO_PARAM_1);
  const AUTO_EXPR_2 = CodeWordsJS.ES6.stringLiteral(AUTO_PARAM_2);

  const CONSTRUCTED_VALUETYPE = new JsValueType(JsValueTypeFlags.OBJECT);

  const FN_SPEC_NO_ARGUMENTS_NO_AUTOCOMPLETION = {
    args: [],
    autocompletions: [],
    returnType: CONSTRUCTED_VALUETYPE
  };
  const FN_SPEC_TWO_ARGUMENTS_WITH_AUTOCOMPLETION = {
    args: [STRING_LITERAL, STRING_LITERAL],
    autocompletions: [{
      args: [AUTO_EXPR_1, AUTO_EXPR_2]
    }],
    returnType: CONSTRUCTED_VALUETYPE
  };

  const CONSTRUCTOR_TYPE_NO_ARGUMENTS_NO_AUTOCOMPLETION =
      new JsValueType(JsValueTypeFlags.CONSTRUCTOR, {
        functionSpec: FN_SPEC_NO_ARGUMENTS_NO_AUTOCOMPLETION
      });
  const CONSTRUCTOR_TYPE_TWO_ARGUMENTS_WITH_AUTOCOMPLETION =
      new JsValueType(JsValueTypeFlags.CONSTRUCTOR, {
        functionSpec: FN_SPEC_TWO_ARGUMENTS_WITH_AUTOCOMPLETION
      });

  const CONSTRUCTOR_EXPR_NO_ARGUMENTS_NO_AUTOCOMPLETION =
      new IdentifierExpression(ES6, IDENTIFIER, {
        name: 'ConstructorRef',
        valueType: CONSTRUCTOR_TYPE_NO_ARGUMENTS_NO_AUTOCOMPLETION
      });
  const CONSTRUCTOR_EXPR_TWO_ARGUMENTS_WITH_AUTOCOMPLETION =
      new IdentifierExpression(ES6, IDENTIFIER, {
        name: 'ConstructorRef',
        valueType: CONSTRUCTOR_TYPE_TWO_ARGUMENTS_WITH_AUTOCOMPLETION
      });

  const EMPTY_PARAMETERS = CALL_PARAMETERS.newExpression(ES6);

  Object.freeze(CONSTRUCTED_VALUETYPE);
  Object.freeze(FN_SPEC_NO_ARGUMENTS_NO_AUTOCOMPLETION);
  Object.freeze(FN_SPEC_TWO_ARGUMENTS_WITH_AUTOCOMPLETION);
  Object.freeze(CONSTRUCTOR_TYPE_NO_ARGUMENTS_NO_AUTOCOMPLETION);
  Object.freeze(CONSTRUCTOR_TYPE_TWO_ARGUMENTS_WITH_AUTOCOMPLETION);
  Object.freeze(CONSTRUCTOR_EXPR_NO_ARGUMENTS_NO_AUTOCOMPLETION);
  Object.freeze(CONSTRUCTOR_EXPR_TWO_ARGUMENTS_WITH_AUTOCOMPLETION);
  Object.freeze(EMPTY_PARAMETERS);

  beforeEach(() => {
    // Construct the SnippetContext so that any change attempts will throw.
    // The match functions should only use the language reference, anyway.
    const astDoc = ES6.newExpression('DOCUMENT');
    astDoc.freeze();
    this.context = {
      astDoc
    };

    this.parser = new CodeWordsJS.Search.NewObjectSearchParser();
  });

  it('parses \'new ConstructorRef()\'', () => {
    const text = 'new ConstructorRef()blah blah blah';
    const output = {
      inputEnd: 'new ConstructorRef()'.length,
      classExpr: CONSTRUCTOR_EXPR_NO_ARGUMENTS_NO_AUTOCOMPLETION,
      paramsExpr: EMPTY_PARAMETERS,
      mayContinue: false
    };

    // Mock
    let delegateCallCount = 0;
    this.context.delegateSubParse = (optSubcontext, substringStart, callback) => {
      switch (++delegateCallCount) {
        case 1: {
          // Constructor reference expression.
          expect(optSubcontext).toBeDefined();
          expect(optSubcontext.isValueTypeAllowed).toBeDefined();  // TODO: Test further
          expect(substringStart).toEqual(text.indexOf('C'));  // of 'ConstructorRef'

          const mockSubparseResult = {
            input: text,
            inputStart: substringStart,
            inputEnd: substringStart + 'ConstructorRef'.length,
            score: 1111,
            getExpression: () => CONSTRUCTOR_EXPR_NO_ARGUMENTS_NO_AUTOCOMPLETION
          };

          return callback(this.context, 0, mockSubparseResult)
        }

        case 2: {
          // Call parameters expression.
          expect(optSubcontext).toBeDefined();
          expect(optSubcontext.isExpressionTypeAllowed).toBeDefined();  // TODO: Test further
          expect(substringStart).toEqual(text.indexOf('('));  // of '()'

          const mockSubparseResult = {
            input: text,
            inputStart: substringStart,
            inputEnd: substringStart + 2,
            score: 2222,
            getExpression: () => EMPTY_PARAMETERS
          };

          return callback(this.context, 0, mockSubparseResult)
        }

        default:
          throw new Error(`Unexpected call #${delegateCallCount} to delegateSubParse.`);
      }
    };

    this.testInputOutputsInOneShot(text, [output]);

    // Reset
    delegateCallCount = 0;
    this.testInputOutputsIteratively(text, [output]);
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
      expect(expr).toBeDefined();
      expect(expr.type).toEqual(CodeWordsJS.NEW);
      expect(expr.getChild('class')).toBe(outputSpec.classExpr);
      expect(expr.getChild('params')).toBe(outputSpec.paramsExpr);
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
      expect(expr).toBeDefined();
      expect(expr.type).toEqual(CodeWordsJS.NEW);
      expect(expr.getChild('class')).toBe(outputSpec.classExpr);
      expect(expr.getChild('params')).toBe(outputSpec.paramsExpr);
    }
    for (; i < expectedOutputs.length; ++i) {
      // Hacky descriptive failure for missing result.
      expect('Missing PendingParse').toEqual(expectedOutputs[i]);
    }
  }
});
