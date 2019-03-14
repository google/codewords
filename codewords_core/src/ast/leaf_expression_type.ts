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

/// <reference path="ast_document.ts" />
/// <reference path="expression.ts" />
/// <reference path="expression_type.ts" />
/// <reference path="leaf_expression.ts" />

namespace CodeWords.AST {
  /**
   * Base ExpressionType for LeafExpressions.
   *
   * <pre><code>
   * // Create the ExpressionType. Pass it into the CodeLanguage.
   * const SIMPLE = new LeafExpression.Type('simple');
   * const LANGUAGE = new CodeLanguage('Example', [SIMPLE]);  // TODO: Add more types.
   *
   * // There are two ways to create a LeafExpression instance:
   * let exprFromType = SIMPLE.newExpression(LANGUAGE);
   * let exprFromLang = LANGUAGE.newExpression('simple');
   *
   * // Use with LeafExpression subclasses to store data:
   * class NumberExpression extends LeafExpression { ... }
   * const NUMBER = new LeafExpressionType('number',
   *     function(language, type, config) {
   *       let value = Number(config); // TODO: Check type before cast.
   *       return new NumberExpression(language, type, value);
   *     });
   * // Add NUMBER to the CodeLanguage
   * let five = LANGUAGE.newExpression('number', 5);
   * </code></pre>
   *
   * @param name The identifying name of the expression type. must be unique
   *             among the CodeLanguage expression type names.
   * @param optFactoryFn An optional function used to generate the Expression
   *                     objects for this type. If not specified, it will use
   *                     LeafExpressionType.DefaultFactoryFn(..).
   */
  export class LeafExpressionType extends ExpressionType {
    /**
     * @param name The name of the expression type. It must be unique within
     *             its language.
     * @param optFactoryFn An optional override function to create new
     *                     instances.
     * @param optInitBeforeFreeze Optional initializer function called before
     *                            this ExpressionType is frozen.
     */
    constructor(name: string,
                optFactoryFn?: ExpressionFactoryFn,
                optInitBeforeFreeze?: ExpressionTypeInitializer) {
      super(name, optFactoryFn || LeafExpressionType.DefaultFactoryFn, optInitBeforeFreeze);
    }

    /**
     * Default LeafExpression factory function that constructs raw
     * LeafExpression objects.
     */
    static DefaultFactoryFn(
        language: CodeLanguage, type: LeafExpressionType): Expression {
      return new LeafExpression(language, type);
    }
  }
}
