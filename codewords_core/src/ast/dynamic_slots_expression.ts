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

namespace CodeWords.AST {
  import CodeLanguage = CodeWords.CodeLanguage;
  import Expression = CodeWords.AST.Expression;
  import ExpressionOptions = CodeWords.AST.ExpressionOptions;

  /**
   * Legal characters for the unique slot ID.  Should be all on a US keyboard.
   * @private
   */
  const GENERATED_SLOT_NAME_CHARS_ =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  export interface DynamicSlotsOptions extends ExpressionOptions {
    /** The children to add to the expression at construction. */
    children?: Expression[];

    /**
     * The slot names of the children added at construction. Must be the same
     * length and ordering as children.
     */
    slotNames?: string[] | ReadonlyArray<string>;
  }

  /**
   * An expression node in the abstract syntax that can contain an unbounded
   * list of children. This is usually the case where all children share the
   * same role, and order is more important than identity. This is true for
   * most top-level documents, and most procedural blocks of code.
   *
   * To support debugging, the DynamicSlotsExpression can prefix all slot names
   * with the numeric indices just before freezing. However, over the course of
   * editing a document, this embedded numbers may not retain their implied
   * ordering. A renumbered clone will rename the slots, but possibly break
   * AST paths that reference through the expression.
   */
  export class DynamicSlotsExpression extends Expression {
    /** The type definition of the expression. (Type narrowing of Expression.type.) */
    readonly type: DynamicSlotsExpressionType;

    /**
     * Array of this.children_ in render order. Set during .freeze() using the
     * value from .getChildren().
     */
    private childrenArray_: Expression[] | undefined;

    /**
     * @param language The language this expression is part of.
     * @param exprTypeOrTypeName The expression type definition or the type name.
     * @param options Options to configure the expression at construction.
     */
    constructor(language: CodeLanguage,
                exprTypeOrTypeName: DynamicSlotsExpressionType | string,
                options?: DynamicSlotsOptions) {
      super(language, exprTypeOrTypeName, options);

      if (options && options.children) {
        const children = options.children;
        const slotNames = options.slotNames;
        if (slotNames) {
          validateSlotNames(slotNames);
          if (children.length !== slotNames.length) {
            throw new Error(
                `Mismatched arguments: ${children.length} children and ${slotNames} slot names.`);
          }
          if (Object.isFrozen(slotNames)) {
            this.slotNames_ = slotNames as string[];
          } else {
            this.slotNames_ = [...slotNames];
          }
          this.slotNames_.forEach((slot, i) => {
            this.children_[slot] = children[i];
          });
        } else {
          this.splice(0, 0, ...children);
        }
      }
    }

    /**
     * @return The number of children of this expression.
     */
    getChildCount(): number {
      return this.slotNames_.length;  // Assumes all slots are filled.
    }

    /**
     * @return A new array with all child expressions, in render order.
     */
    getChildren(): Expression[] {
      if (this.childrenArray_) {
        return this.childrenArray_;
      }
      return this.slotNames_.map((slot) => this.children_[slot]);
    }

    /**
     * Retrieve the child expression at the indexed slot.
     *
     * @param index The index queried.
     * @return The child expression at the index.
     * @throws If index is out of bound or child is otherwise not found.
     */
    getChildAt(index: number): Expression {
      let child;
      if (this.childrenArray_) {
        child = this.childrenArray_[index];
      } else {
        child = this.children_[this.slotNames_[index]];
      }
      if (!child) {
        throw new Error(`Invalid index ${index} for ${this.slotNames_.length} slots.`);
      }
      return child;
    }

    /**
     * Changes the contents of the slots and children.
     *
     * @param start Index at which to start. See Array.splice(..).
     * @param deleteCount Number of slots and children to remove. See Array.splice(..).
     * @param newChildren New children to add to this expression.
     * @throws If the expression is already frozen.
     */
    splice(start: number, deleteCount: number, ...newChildren: Expression[]) {
      if (Object.isFrozen(this)) {
        throw new Error('Expression is frozen.');
      }

      validateSlotValues(newChildren, this.language);

      const newSlots: string[] = [];
      if (newChildren) {
        this.childrenArray_ = undefined;

        for (const child of newChildren) {
          const slot = this.generateNewSlotName_();
          newSlots.push(slot);
          this.children_[slot] = child;
        }
      }

      const deletedSlots = this.slotNames_.splice(start, deleteCount, ...newSlots);
      if (deletedSlots.length) {
        this.childrenArray_ = undefined;

        const deleted: Expression[] = [];
        for (const slot of deletedSlots) {
          deleted.push(this.children_[slot]);
          delete this.children_[slot];
        }
        return deleted;
      } else {
        return [];
      }
    }

    /**
     * Append children to any current children.
     * @param children Expressions to be appended as children.
     */
    append(...children: Expression[]) {
      this.splice(this.slotNames_.length, 0, ...children);
    }

    /**
     * Make this expression object, with all slots and children immutable.
     *
     * freeze() is called when this expression is added to a parent expression,
     * an action, or other Editor state.
     *
     * @param options A set of configuration options sub classes can apply before
     *                freezing. These should be passed to children during freezing.
     * @return This DynamicSlotsExpression.
     */
    freeze(options?: FreezeOptions): DynamicSlotsExpression {
      if (Object.isFrozen(this)) {
        return this;
      }

      const validate = options && options.validate;
      const prefixDynamicSlotIndex = options && options.prefixDynamicSlotIndex;

      if (validate) {
        // Verify all slots are filled.
        for (const name of this.slotNames_) {
          if (!this.children_[name]) {
            throw new Error(
                `Expected all dynamic slot to have assigned children. Unfilled slot: ${name}`);
          }
        }
      }
      if (prefixDynamicSlotIndex) {
        this.renameSlotsWithNumberPrefix();
      }

      this.childrenArray_ = this.getChildren();
      Object.freeze(this.childrenArray_);
      return super.freeze(options) as DynamicSlotsExpression;
    }

    /**
     * Renames the slots to include their index number.
     */
    renameSlotsWithNumberPrefix() {
      this.slotNames_.forEach((origName, i) => {
        // TODO: Remove prior prefix
        // TODO: Leading zeros
        const newName = `${i}_${origName}`;
        this.slotNames_.splice(i, 1, newName);

        const child = this.children_[origName];
        if (child) {
          // TODO: Does this delete break JIT optimizations?
          delete this.children_[origName];
          this.children_[newName] = child;
        }
      });
    }

    /**
     * Implements Expression.makeShallowClone().
     *
     * @return A new DynamicSlotsExpression with the same slots and children.
     */
    makeShallowClone(): DynamicSlotsExpression {
      const options = this.makeShallowCloneOptions();
      return new DynamicSlotsExpression(this.language, this.type, options);
    }

    /**
     * Implements Expression.makeShallowCloneOptions(), returning a complete
     * DynamicSlotsOptions.
     */
    makeShallowCloneOptions(): DynamicSlotsOptions {
      return {
        ...super.makeShallowCloneOptions(),
        slotNames: this.slotNames_.slice(0),
        children: this.getChildren(),
      };
    }

    /**
     * Randomly generates a valid slot name that is unique among the current
     * slots.
     * @return {string} A randomly generated unique and valid slot name.
     */
    protected generateNewSlotName_(): string {
      let name = generateSlotName_(4);
      while (this.slotNames_.indexOf(name) !== -1) {
        // Should almost never get here.
        name = generateSlotName_(name.length + 1);
      }
      return name;
    }

    // TODO: makeRenumberedClone(). Add renumber option to makeShallowCloneOptions()?
  }

  /**
   * Randomly generates a valid slot name. Because the slot names are used in
   * path chains, and may be prefixed with child indices, shorter names are
   * preferred. Collision probabilities are low because the scope is limited
   * to a single expression. In the context of DynamicSlotExpressions, the
   * generated name can be checked against existing slot names, and it is cheap
   * to generate a new name.
   *
   * This currently generates a four character, case sensitive alphanumeric
   * names, for a space of 14.7 million possible names.
   *
   * @param length The length of the name to generate. Should be at least 4.
   * @return A randomly generated valid slot name.
   */
  function generateSlotName_(length: number): string {
    const charCount = GENERATED_SLOT_NAME_CHARS_.length;
    // This is the common case. Unrolled the loop.
    let name = GENERATED_SLOT_NAME_CHARS_.charAt(Math.random() * charCount) +
               GENERATED_SLOT_NAME_CHARS_.charAt(Math.random() * charCount) +
               GENERATED_SLOT_NAME_CHARS_.charAt(Math.random() * charCount) +
               GENERATED_SLOT_NAME_CHARS_.charAt(Math.random() * charCount);
    if (length > 4) {
      // This should rarely get here. Only in the case of a collision.
      for (let i = 4; i < length; ++i) {
        name += GENERATED_SLOT_NAME_CHARS_.charAt(Math.random() * charCount);
      }
    }
    return name;
  }
}
