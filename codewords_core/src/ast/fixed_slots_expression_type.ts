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

/// <reference path="expression.ts" />
/// <reference path="expression_type.ts" />
/// <reference path="slots.ts" />

namespace CodeWords.AST {
  /**
   * ExpressionType for FixedSlotsExpressions.
   *
   * <pre><code>
   * // Create the ExpressionType. Pass it into the CodeLanguage.
   * const DATA_PAIR = new FixedSlotsExpressionType('data_pair', ['key','value']);
   * const LANGUAGE = new CodeLanguage('Example', [DATA_PAIR]);  // TODO: Add more types.
   *
   * // There are two ways to create a FixedSlotsExpression instance:
   * let dataPair1 = DATA_PAIR.newExpression(LANGUAGE,
   *     { // Optionally assign children immediately
   *       children: {
   *         key: keyNameExpression,
   *         value: dataValueExpression
   *       }
   *     });
   * let dataPair2 = LANGUAGE.newExpression('data_pair',
   *     { // Optionally assign children immediately
   *       children: {
   *         key: keyNameExpression,
   *         value: dataValueExpression
   *       }
   *     });
   * </code></pre>
   *
   * @param name The identifying name of the expression type. must be unique
   *             among the CodeLanguage expression type names.
   * @param optFactoryFn An optional function used to generate the Expression
   *                     objects for this type. If not specified, it will use
   *                     FixedSlotsExpressionType.DefaultFactoryFn(..).
   */
  export class FixedSlotsExpressionType extends ExpressionType {
    /**
     * The list of slot names for FixedSlotsExpression types.
     */
    slotNames: string[];

    /**
     * @param name The name of the expression type. It must be unique within
     *             its language.
     * @param slotNames The slot names for expressions of this type.
     * @param optFactoryFn An optional override function to create new
     *                     instances.
     * @param optInitBeforeFreeze Optional initializer function called before
     *                            this ExpressionType is frozen.
     */
    constructor(name: string,
                slotNames: string[],
                optFactoryFn?: ExpressionFactoryFn,
                optInitBeforeFreeze?: ExpressionTypeInitializer) {
      super(name, optFactoryFn || FixedSlotsExpressionType.DefaultFactoryFn,
          function(this: FixedSlotsExpressionType) {
            if (!slotNames || slotNames.length === 0) {
              throw new Error(`ExpressionType '${name}' requires slotNames. Found: ${slotNames}`);
            }

            validateSlotNames(slotNames);
            Object.freeze(slotNames);
            this.slotNames = slotNames;
          });
    }

    /**
     * Constructs a new FixedSlotsExpression object of this expression type.
     * Takes a FixedSlotsOptions configuration parameter to pre-populate the
     * children.
     *
     * @param language The CodeLanguage the new expression belongs to.
     * @param config A options object to pre-populate the expression.
     */
    newExpression(language: CodeLanguage, config?: FixedSlotsOptions): Expression {
      return super.newExpression(language, config);
    }

    /**
     * Default FixedSlotExpression factory function.
     */
    static DefaultFactoryFn(language: CodeLanguage,
                            type: ExpressionType,
                            options: FixedSlotsOptions)
    : Expression {
      if (!(type instanceof CodeWords.AST.FixedSlotsExpressionType)) {
        throw new Error('ExpressionType is not FixedSlotsExpressionType');
      }
      return new FixedSlotsExpression(language, type, options);
    }
  }
}
