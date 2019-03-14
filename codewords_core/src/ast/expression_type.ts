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
/// <reference path="slots.ts" />

namespace CodeWords.AST {
  /** Function used to initialize an ExpressionType before freezing it. */
  // tslint:disable-next-line: no-any
  export type ExpressionTypeInitializer = (self: ExpressionType) => any;

  /**
   * A object or value passed into the ExpressionFactoryFn to initialize the
   * expression.
   */
  // tslint:disable-next-line: no-any
  export type ExpressionConfig = any;

  /**
   * The function used to create Expression instances.
   */
  export type ExpressionFactoryFn =
      (language: CodeLanguage, type: ExpressionType, config?: ExpressionConfig) => Expression;

  export abstract class ExpressionType {
    /**
     * The name used to distinguish and identify this type from other
     * expressions in the language. This must be unique among the
     * ExpressionTypes in a given CodeLanguage.
     */
    name: string;

    /**
     * Function to construct a new Expression object of this expression type.
     * The expression can be pre-populated with the help of the configuration
     * parameter.
     *
     * @param language The CodeLanguage the new expression belongs to.
     * @param config A object or value used to pre-populate the expression.
     * @private
     */
    // TODO: Figure out why TypeScript didn't like the private modifier here.
    factoryFn_: ExpressionFactoryFn;

    /**
     * @param name The name of the expression type. It must be unique within
     *             its language.
     * @param expressionFactoryFn The function to create new instances.
     * @param optInitBeforeFreeze Optional initializer function called before freezing.
     *
     * @throws If type name is invalid.
     * @throws If exprClass is not recognized.
     * @throws If constraints for ex
     */
    constructor(name: string,
                expressionFactoryFn: ExpressionFactoryFn,
                optInitBeforeFreeze?: ExpressionTypeInitializer) {
      ExpressionType.validateName(name);
      this.name = name;
      this.factoryFn_ = expressionFactoryFn;

      // Allow subclass to apply edits prior to freezing the class.
      if (optInitBeforeFreeze) {
        optInitBeforeFreeze.call(this, this);
      }

      Object.freeze(this);
    }

    /**
     * Constructs a new Expression object of this expression type.
     * Takes a configuration parameter to pre-populate the values.
     *
     * @param language The CodeLanguage the new expression belongs to.
     * @param config A object or value used to pre-populate the expression.
     */
    newExpression(language: CodeLanguage, config?: ExpressionConfig): Expression {
      return this.factoryFn_(language, this, config);
    }

    /** @return Short description for developers / debugging. */
    toString() {
      return `Expression type '${this.name}'`;
    }

    // TODO: abstract isLeaf(): boolean;
    // TODO: abstract isDocument(): boolean;
    // TODO: abstract hasFixedSlots(): boolean;
    // TODO: abstract hasDynamicSlots(): boolean;

    static validateName(name: string) {
      if (!name || !name.trim()) {
        throw new Error('Expression type name may not be empty.');
      }
      if (name !== name.trim()) {
        throw new Error(`Illegal expression type id "${name}": leading or trailing whitespace.`);
      }
    }
  }
}
