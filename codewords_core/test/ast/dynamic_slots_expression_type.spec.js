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

describe('CodeWords.AST.DynamicSlotsExpressionType', function() {
  const CodeLanguage = CodeWords.CodeLanguage;
  const DynamicSlotsExpression = CodeWords.AST.DynamicSlotsExpression;
  const DynamicSlotsExpressionType = CodeWords.AST.DynamicSlotsExpressionType;

  describe('doc comment example.', () => {
    it('should run', () => {

      ////////////////////////////////////////////////
      //  BEGIN COPY OF DOC COMMENT EXAMPLE

      // Create the ExpressionType. Pass it into the CodeLanguage.
      const BLOCK = new DynamicSlotsExpressionType('block');
      const LANGUAGE = new CodeLanguage('Example', [BLOCK]);

      // Creation of the children is not included in the sample.
      // Needs an expression of the same language, so use the only one.
      let firstChildExpression = BLOCK.newExpression(LANGUAGE);
      let secondChildExpression = BLOCK.newExpression(LANGUAGE);

      // There are two ways to create a DynamicSlotsExpression instance:
      let blockExpression1 = BLOCK.newExpression(LANGUAGE,
          { // Optionally assign children immediately
            children: [
              firstChildExpression,
              secondChildExpression
            ]
          });
      let blockExpression2 = LANGUAGE.newExpression('block',
          { // Optionally assign children immediately
            children: [
                firstChildExpression,
                secondChildExpression
            ]
          });

      //  END COPY OF DOC COMMENT EXAMPLE
      ////////////////////////////////////////////////

      for (let block of [blockExpression1, blockExpression2]) {
        expect(block instanceof DynamicSlotsExpression).toBe(true);
        expect(block.language).toBe(LANGUAGE);
        expect(block.type).toBe(BLOCK);
        expect(block.getChildCount()).toBe(2);
        expect(block.getChildAt(0)).toBe(firstChildExpression);
        expect(block.getChildAt(1)).toBe(secondChildExpression);
      }
    });
  });
});