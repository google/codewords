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

describe('CodeWords.AST.FixedSlotsExpressionType', function() {
  describe('doc comment example.', () => {
    const CodeLanguage = CodeWords.CodeLanguage;
    const FixedSlotsExpression = CodeWords.AST.FixedSlotsExpression;
    const FixedSlotsExpressionType = CodeWords.AST.FixedSlotsExpressionType;

    it('should run', () => {
      ////////////////////////////////////////////////
      //  BEGIN COPY OF DOC COMMENT EXAMPLE

      // Create the ExpressionType. Pass it into the CodeLanguage.
      const DATA_PAIR = new FixedSlotsExpressionType('data_pair', ['key','value']);
      const LANGUAGE = new CodeLanguage('Example', [DATA_PAIR]);

      // Creation of the children is not included in the sample.
      // Needs an expression of the same language, so use the only one.
      let keyNameExpression = DATA_PAIR.newExpression(LANGUAGE);
      let dataValueExpression = DATA_PAIR.newExpression(LANGUAGE);

      // There are two ways to create a FixedSlotsExpression instance:
      let dataPair1 = DATA_PAIR.newExpression(LANGUAGE,
          { // Optionally assign children immediately
            children: {
              key: keyNameExpression,
              value: dataValueExpression
            }
          });
      let dataPair2 = LANGUAGE.newExpression('data_pair',
          { // Optionally assign children immediately
            children: {
              key: keyNameExpression,
              value: dataValueExpression
            }
          });

      //  END COPY OF DOC COMMENT EXAMPLE
      ////////////////////////////////////////////////

      for (let dataExpr of [dataPair1, dataPair2]) {
        expect(dataExpr instanceof FixedSlotsExpression).toBe(true);
        expect(dataExpr.language).toBe(LANGUAGE);
        expect(dataExpr.type).toBe(DATA_PAIR);
        expect(dataExpr.getChild('key')).toBe(keyNameExpression);
        expect(dataExpr.getChild('value')).toBe(dataValueExpression);
      }
    });
  });
});