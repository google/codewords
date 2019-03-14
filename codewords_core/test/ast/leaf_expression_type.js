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

describe('CodeWords.AST.AstDocument', function() {
  describe('doc comment example.', () => {
    const CodeLanguage = CodeWords.CodeLanguage;
    const LeafExpression = CodeWords.AST.LeafExpression;
    const LeafExpressionType = CodeWords.AST.LeafExpressionType;

    it('should run', () => {
      ////////////////////////////////////////////////
      //  BEGIN COPY OF DOC COMMENT EXAMPLE

      // Create the document ExpressionType. Pass it into the CodeLanguage.
      const SIMPLE = new LeafExpressionType('simple');
      const LANGUAGE = new CodeLanguage('Example', [SIMPLE]);

      // There are two ways to create a LeafExpression instance:
      let exprFromType = SIMPLE.newExpression(LANGUAGE);
      let exprFromLang = LANGUAGE.newExpression('simple');

      // Use with LeafExpression subclasses to store data:
      class NumberExpression extends LeafExpression {
        constructor(language, exprType, value) {
          super(language, exprType);
          this.value = value;
        }
      }
      const NUMBER = new LeafExpressionType('number',
          function(language, type, config) {
            const value = Number(config);
            return new NumberExpression(language, NUMBER, value);
          });
      const LANGUAGE2 = new CodeLanguage('Example', [NUMBER]);
      let five = LANGUAGE2.newExpression('number', 5);

      //  END COPY OF DOC COMMENT EXAMPLE
      ////////////////////////////////////////////////

      for (let docExpr of [exprFromType, exprFromLang]) {
        expect(docExpr instanceof LeafExpression).toBe(true);
        expect(docExpr.type).toBe(SIMPLE);
      }

      expect(five instanceof NumberExpression).toBe(true);
      expect(five.value).toBe(5);
    });
  });
});