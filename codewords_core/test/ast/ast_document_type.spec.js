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
    const AstDocument = CodeWords.AST.AstDocument;
    const AstDocumentType = CodeWords.AST.AstDocumentType;
    const CodeLanguage = CodeWords.CodeLanguage;

    it('should run', () => {
      ////////////////////////////////////////////////
      //  BEGIN COPY OF DOC COMMENT EXAMPLE

      // Create the document ExpressionType. Pass it into the CodeLanguage.
      const DOCUMENT = new AstDocumentType('document');
      const LANGUAGE = new CodeLanguage('Example', [DOCUMENT]);

      // Creation of the children is not included in the sample.
      // Needs an expression of the same language, so use the only one.
      let firstChildExpression = DOCUMENT.newExpression(LANGUAGE);
      let secondChildExpression = DOCUMENT.newExpression(LANGUAGE);

      // There are two ways to create a AstDocument expression:
      let document1 = DOCUMENT.newExpression(LANGUAGE,
          { // Optionally assign children immediately
            children: [
              firstChildExpression,
              secondChildExpression
            ]
          });
      let document2 = LANGUAGE.newExpression('document',
          { // Optionally assign children immediately
            children: [
              firstChildExpression,
              secondChildExpression
            ]
          });

      //  END COPY OF DOC COMMENT EXAMPLE
      ////////////////////////////////////////////////

      for (let docExpr of [document1, document2]) {
        expect(docExpr instanceof AstDocument).toBe(true);
        expect(docExpr.language).toBe(LANGUAGE);
        expect(docExpr.type).toBe(DOCUMENT);
        expect(docExpr.getChildCount()).toBe(2);
        expect(docExpr.getChildAt(0)).toBe(firstChildExpression);
        expect(docExpr.getChildAt(1)).toBe(secondChildExpression);
      }
    });
  });
});