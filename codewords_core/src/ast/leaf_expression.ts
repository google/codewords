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
  import LeafExpressionType = CodeWords.AST.LeafExpressionType;

  /**
   * Expression class marking a class with no slots.
   */
  export class LeafExpression extends Expression {
    /** The type definition of the expression. (Type narrowing of Expression.type.) */
    readonly type: LeafExpressionType;

    /**
     * @param language The language this expression is part of.
     * @param exprTypeOrTypeName The expression type definition or the type
     *                           name.
     * @param options The options with which to initialize this expression.
     */
    constructor(language: CodeLanguage,
                exprTypeOrTypeName: LeafExpressionType | string,
                options?: ExpressionOptions) {
      super(language, exprTypeOrTypeName, options);
      if (options && options.containerScope) {
        throw new Error('LeafExpression cannot have a ContainerScope.');
      }
    }

    /**
     * Overrides Expression.assignSlot(), always throwing an error since a leaf
     * cannot have children.
     */
    assignSlot(slotName: string, child: Expression) {
      throw new Error(`${this.type} may not have children.`);
    }

    /** Implements Expression.makeShallowClone(). */
    makeShallowClone(): LeafExpression {
      const options = this.makeShallowCloneOptions();
      return new LeafExpression(this.language, this.type, options);
    }
  }
}
