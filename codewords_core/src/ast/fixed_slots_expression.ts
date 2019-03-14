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
  import CodeLanguage = CodeWords.CodeLanguage;
  import Expression = CodeWords.AST.Expression;
  import ExpressionOptions = CodeWords.AST.ExpressionOptions;

  export interface FixedSlotsOptions extends ExpressionOptions {
    /** The children to add to the expression at construction. */
    children?: SlotChildren;
  }

  /**
   * An expression node where slots names are fixed, defined during
   * ExpressionType construction.
   */
  export class FixedSlotsExpression extends Expression {
    /** The type definition of the expression. (Type narrowing of Expression.type.) */
    readonly type: FixedSlotsExpressionType;

    /**
     * @param language The language this expression is part of.
     * @param exprTypeOrTypeName The expression type definition or the type
     *                           name.
     * @param options An initial set of child Expressions.
     */
    constructor(language: CodeLanguage,
                exprTypeOrTypeName: FixedSlotsExpressionType | string,
                options?: FixedSlotsOptions) {
      super(language, exprTypeOrTypeName, options);
      this.slotNames_ = (this.type as FixedSlotsExpressionType).slotNames;

      if (options && options.children) {
        const children = options.children;
        if (children.__proto__ &&
            (children.constructor !== Object)) {
          // Avoid potential issues with prototype properties.
          throw new Error('optChildren must be a plain object.');
        }
        this.validateAndAssignSlots_(children);
      }
    }

    /**
     * Assign the child expression to the named slot. Replaces any prior child
     * in that slot. Throws if the slot is not a recognized name.
     *
     * @param slotName The name of the slot to fill.
     * @param child The child to assign to the slot.
     * @throws If slotName is not one of the predefined names.
     */
    setChild(slotName: string, child: Expression) {
      if (this.slotNames_.indexOf(slotName) === -1) {
        throw new Error(`No slot "${slotName}" for expression type "${this.type.name}"`);
      }
      this.assignSlot(slotName, child);
    }

    /**
     * Checks slots for valid slot names and valid child expressions, if any.
     *
     * @param children The object containing the child expressions / slot values.
     * @throws If a slot name or child is invalid.
     */
    validateAndAssignSlots_(children: SlotChildren) {
      const slotNames = this.getSlotNames();

      for (const childName of Object.getOwnPropertyNames(children)) {
        if (slotNames.indexOf(childName) === -1) {
          throw new Error(`Invalid slot name "${childName}"`);
        }
        try {
          const child = children[childName];

          // Use the publicly exported reference to validateSlotValue().
          CodeWords.AST.validateSlotValue(child, this.language);
          this.children_[childName] = child;
        } catch (e) {
          throw new Error(`Slot "${childName}":  ${e.message}`);
        }
      }
    }

    /**
     * Implements Expression.makeShallowClone().
     *
     * @return A new DynamicSlotsExpression with the same slots and children.
     */
    makeShallowClone(): FixedSlotsExpression {
      const options = this.makeShallowCloneOptions();
      return new FixedSlotsExpression(
          this.language,
          this.type,
          options);
    }

    /**
     * Implements Expression.makeShallowCloneOptions(), returning a complete
     * FixedSlotsOptions.
     */
    makeShallowCloneOptions(): FixedSlotsOptions {
      return {
        ...super.makeShallowCloneOptions(),
        children: {...this.children_},
      };
    }
  }
}
