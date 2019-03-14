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

/// <reference path="./expression.ts" />
/// <reference path="./dynamic_slots_expression.ts" />
/// <reference path="./expression_type.ts" />

namespace CodeWords.AST {
  /**
   * ExpressionType for DynamicSlotsExpressions.
   *
   * <pre><code>
   * // Create the ExpressionType. Pass it into the CodeLanguage.
   * const BLOCK = new DynamicSlotsExpressionType('block');
   * const LANGUAGE = new CodeLanguage('Example', [BLOCK]);  // TODO: Add more types.
   *
   * // There are two ways to create a DynamicSlotsExpression instance:
   * let blockExpression1 = BLOCK.newExpression(LANGUAGE,
   *     { // Optionally assign children immediately
   *       children: [
   *         firstChildExpression,
   *         secondChildExpression
   *       ]
   *     });
   * let blockExpression2 = LANGUAGE.newExpression('block',
   *     { // Optionally assign children immediately
   *       children: [
   *         firstChildExpression,
   *         secondChildExpression
   *       ]
   *     });
   * </code></pre>
   *
   * @param name The identifying name of the expression type. must be unique
   *             among the CodeLanguage expression type names.
   * @param optFactoryFn An optional function used to generate the Expression
   *                     objects for this type. If not specified, it will use
   *                     DynamicSlotsExpressionType.DefaultFactoryFn(..).
   */
  export class DynamicSlotsExpressionType extends ExpressionType {
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
      super(name,
            optFactoryFn || DynamicSlotsExpressionType.DefaultFactoryFn,
            optInitBeforeFreeze);
    }

    /**
     * Constructs a new DynamicSlotsExpression object of this expression type.
     * Takes a DynamicSlotsOptions configuration parameter to pre-populate the
     * children.
     *
     * @param language The CodeLanguage the new expression belongs to.
     * @param options A options object to pre-populate the expression.
     */
    newExpression(language: CodeLanguage, options?: DynamicSlotsOptions): Expression {
      return super.newExpression(language, options);
    }

    /**
     * Default DynamicSlotsExpressions factory function.
     */
    static DefaultFactoryFn(language: CodeLanguage,
                            type: DynamicSlotsExpressionType,
                            options?: DynamicSlotsOptions)
    : Expression {
      // Check type (because JavaScript)
      if (!(type instanceof DynamicSlotsExpressionType)) {
        throw new Error('ExpressionType is not a DynamicSlotsExpressionsType');
      }
      return new DynamicSlotsExpression(language, type, options);
    }
  }
}