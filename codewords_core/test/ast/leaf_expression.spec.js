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

describe('CodeWords.AST.LeafExpression', function() {
  // Type alias
  const Expression = CodeWords.AST.Expression;
  const ExpressionType = CodeWords.AST.ExpressionType;
  const LeafExpression = CodeWords.AST.LeafExpression;

  // Constants
  const TYPE_A = new ExpressionType('a', LeafExpression);
  const EXAMPLE_LANG = new CodeWords.CodeLanguage('EXAMPLE_LANG', [TYPE_A]);

  it('extends Expression', () => {
    let expr = new LeafExpression(EXAMPLE_LANG, 'a');

    expect(expr instanceof Expression).toBeTruthy();
  });

  // TODO: Test makeShallowCloneOptions()
});
