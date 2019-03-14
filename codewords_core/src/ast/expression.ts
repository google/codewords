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

/// <reference path="slots.ts" />

namespace CodeWords.AST {
  export interface ExpressionOptions {
    /**
     * The ValueType this expression represents, if any.
     */
    valueType?: ValueType;

    /**
     * The scope that children of this expression are defined within.
     * containerScope should only be used by container expressions.
     * Initializing a LeafExpression with a containerScope will throw an
     * exception.
     */
    containerScope?: Scope;
  }

  /**
   * An Expression is a node in the editor's abstract syntax tree, including
   * the root document node (see AstDocument).
   *
   * Expressions are composed by assigning children into ordered, named slots.
   * While the Expression base class does not support children,
   * {@link FixedSlotsExpression} and {@link DynamicSlotsExpression} implement
   * the required query and traversal methods.
   *
   * Expression objects are central to the Editor's state, and are passed
   * around between many classes. As such, an Expression tree and all of its
   * objects are frozen as soon as any are added to a document, an editor, an
   * action or a snippet. This occurs via the freeze() method, and any class
   * that overrides Expression with state much also override the freeze()
   * method.
   */
  export abstract class Expression {
    /** The language this expression is part of. */
    readonly language: CodeLanguage;

    /** The type definition of the expression. */
    readonly type: ExpressionType;

    /** The ValueType of the expression. Access via getValueType(). */
    private valueType_: ValueType | undefined;

    /** The scope that children of this expression are defined within. */
    private containerScope_: Scope | undefined;

    /**
     * The names of the allowed slots for this expression, in render order.
     *
     * In the Expression base, this is never assigned slot names. See
     * FixedSlotsExpression and DynamicSlotsExpression for uses.
     */
    protected slotNames_: string[] = [];

    /**
     * The container for references to all child expressions.
     *
     * In the Expression base, this is never assigned children. See
     * FixedSlotsExpression and DynamicSlotsExpression for uses.
     */
    protected children_: SlotChildren = Object.create(null);

    /**
     * @param language The language this expression is part of.
     * @param exprTypeOrTypeName The expression type definition or the type
     *                           name.
     * @param options The options for this expression.
     */
     constructor(language: CodeLanguage,
                 exprTypeOrTypeName: ExpressionType | string,
                 options?: ExpressionOptions) {
      // Validate language and typeId
      if (!language || !exprTypeOrTypeName) {
        throw new Error('Requires CodeLanguage and ExpressionType.');
      }
      let exprType;
      if (exprTypeOrTypeName instanceof ExpressionType) {
        exprType = exprTypeOrTypeName as ExpressionType;
        if (language.types[exprType.name] !== exprType) {
          throw new Error(`Type "${exprType.name}" is not an ExpressionType of ${language}.`);
        }
      } else {
        exprType = language.types[exprTypeOrTypeName];
        if (!exprType) {
          throw new Error(`Type name "${exprTypeOrTypeName}" is not recognized for ${language}.`);
        }
      }
      // TODO: Validate via the language the ValueType and expression type combo.

      // Set read-only properties.
      Object.defineProperty(this, 'language', { value: language});
      Object.defineProperty(this, 'type', { value: exprType });

      if (options) {
        this.valueType_ = options.valueType;
        this.containerScope_ = options.containerScope;
      }
    }

    /**
     * If this expression can contain child expressions, it may return a the
     * scope where the child expressions are defined. It will always return
     * undefined for LeafExpressions, as they do not contain children.
     *
     * @return the scope where the child expressions are defined.
     */
    getContainerScope() {
      return this.containerScope_;
    }

    /**
     * Returns the ValueType this expression represents.
     *
     * Expressions often represent values in their language. getValueType()
     * retrieves a descriptor for the type of that value, useful in determining
     * where an expression may fit in a document.
     *
     * The base implementation returns the ValueType passed into the
     * constructor. Override this method if the ValueType may change after
     * construction (such as in the case of a variable).
     *
     * @return The ValueType describing the type of value for the expression,
     *         if any. Otherwise undefined.
     */
    getValueType(): ValueType | undefined {
      return this.valueType_;
    }

    /**
     * Retrieves the names of the slots for child expressions, whether or not
     * they are filled.
     *
     * By default this returns an empty list, since the base Expression class
     * does not have children. Subclasses that allow children must override
     * this method.
     *
     * @return The list of slot names, in render order.
     */
    getSlotNames(): string[] {
      return Object.isFrozen(this.slotNames_) ?
          Object.freeze(this.slotNames_) as string[] : this.slotNames_.slice(0);
    }

    /**
     * Check whether the slot is a valid name for this expression.
     *
     * By default, this returns whether the name exists in this.slotsNames_.
     * Since the base Expression class does not have children this will return
     * false.
     *
     * @param name The slot name in question.
     * @return Whether the is a valid slot for this expression.
     */
    isSlotName(name: string): boolean {
      return this.slotNames_.indexOf(name) !== -1;
    }

    /**
     * Retrieves the child from the requested slot, if any.
     *
     * @param slotName The slot to find the requested child.
     * @return The child stored in the slot, or undefined if not found.
     */
    getChild(slotName: string): Expression | undefined  {
      return this.children_[slotName] || null;
    }

    /**
     * Get the descendant at the specified path.
     * @param path The path of slot names.
     * @param start The index of slot name in the path to start at.
     * @param end The index of slot name in the path to end at, exclusively.
     */
    getDescendant(path: string[], start = 0, end = path.length): Expression | undefined {
      if (!Array.isArray(path)) {
        throw new Error('Invalid path: ' + path);
      }
      if (start >= 0 && end <= path.length && start <= end) {
        let expr: (Expression | undefined) = this;
        for (let i = start; expr && i < end; ++i) {
          expr = expr.getChild(path[i]);
        }
        return expr;
      } else {
        throw new Error(`Out of bounds: start ${start}, end ${end}, path ${path}`);
      }
    }

    /**
     * Assigns a slot with the provided child, possibly overwriting a prior
     * child value.
     * @param slotName The slot to assign to.
     * @param child The new child expression.
     */
    assignSlot(slotName: string, child: Expression) {
      if (Object.isFrozen(this)) {
        throw new Error('Expression is frozen');
      }
      if (this.slotNames_.indexOf(slotName) === -1) {
        throw new Error(`Unknown slot "${slotName}`);
      }
      validateSlotValue(child, this.language);
      this.children_[slotName] = child;
    }

    /**
     * Make this expression object, with all slots and children immutable.
     *
     * freeze() is called when this expression is added to a parent expression,
     * an action, or other Editor state.
     *
     * @param options A set of configuration options sub classes can apply before
     *                freezing. These should be passed to children during freezing.
     * @return This Expression.
     */
    freeze(options?: CodeWords.AST.FreezeOptions): Expression {
      if (Object.isFrozen(this)) {
        return this;
      }

      const validate = options && options.validate;

      if (validate) {
        validateSlotNames(this.slotNames_);
      }
      Object.freeze(this.slotNames_);

      // Traverse the tree in depth first manner, in render order,
      // while potentially tracking the a list of child names in use.
      const childNames = validate && Object.getOwnPropertyNames(this.children_);
      for (const slot of this.slotNames_) {
        if (childNames) {
          const i = childNames.indexOf(slot);
          if (i !== -1) {
            childNames.splice(i, 1);
          }
        }

        const child = this.children_[slot];
        if (child) {
          if (validate) {
            validateSlotValue(child, this.language);
          }

          // Traverse deeper
          child.freeze(options);
        }
      }
      if (childNames && childNames.length) {
        throw new Error(`Found children in undeclared slots: ${childNames}`);
      }

      Object.freeze(this.children_);
      Object.freeze(this);
      return this;
    }

    /**
     * Constructs an unfroze shallow copy of this expression. Child expressions
     * may still be frozen. Be careful when cloning an unfrozen expression, as
     * the children will be shared and may also be mutable/unfrozen.
     */
    abstract makeShallowClone(): Expression;

    /**
     * @return A new options object, that would construct a shallow clone of
     *         this expression if passed into the constructor of this class.
     */
    makeShallowCloneOptions(): ExpressionOptions {
      return {
        valueType: this.valueType_,
        containerScope: this.containerScope_,
      };
    }

    /** @return Short description for developers / debugging. */
    toString() {
      return `'${this.type.name}' expression`;
    }
  }
}
