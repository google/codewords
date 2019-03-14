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

/// <reference path="../../codewords_core/build/codewords_core.d.ts" />
/// <reference path="./expression/identifier_expression.ts" />
/// <reference path="./expression/js_expression_types.ts" />
/// <reference path="./expression/number_literal_expression.ts" />
/// <reference path="./expression/string_literal_expression.ts" />


namespace CodeWordsJS {
  import CodeLanguage = CodeWords.CodeLanguage;
  import DynamicSlotsExpression = CodeWords.AST.DynamicSlotsExpression;
  import Expression = CodeWords.AST.Expression;
  import ExpressionType = CodeWords.AST.ExpressionType;
  import Scope = CodeWords.AST.Scope;
  import MetaLine = CodeWords.Render.MetaLine;
  import Span = CodeWords.Render.Span;
  import DropTargetPosition = CodeWords.Render.DropTargetPosition;
  import DropTargetType = CodeWords.Render.DropTargetType;
  import genDropTargetId = CodeWords.Render.genDropTargetId;

  import JsValueType = CodeWordsJS.Value.JsValueType;
  import JsValueTypeFlags = CodeWordsJS.Value.JsValueTypeFlags;

  /**
   * Base class for all JavaScript CodeLanguage implementations.
   */
  export class JavaScriptCode extends CodeLanguage {
    constructor(name: string, exprTypes: ExpressionType[]) {
      super(name, exprTypes);
    }

    /**
     * Implements CodeLanguage.buildLines(..). Constructs a sequence of MetaLines
     * for the given Expressions.
     *
     * @param expr The expression to build lines for.
     * @param optPath The path name to the current expression.
     * @param optScope The scope where the expressions on this line are defined.
     * @param optIndentCount A count of indents (tabs) used in recursion.
     * @return The {@link MetaLine}s that divide the expressions.
     */
    buildLines(expr: Expression,
               optPath?: string[],
               optScope?: Scope,
               optIndentCount?: number)
    : MetaLine[] {
      const path = optPath || [];
      const indentCount = optIndentCount || 0;

      const lines: MetaLine[] = [];
      switch(expr.type.name) {
        case DOCUMENT.name:
          const doc = expr as DynamicSlotsExpression;
          const children = doc.getChildren();
          const slotNames = doc.getSlotNames();
          const childScope = expr.getContainerScope() || optScope;
          children.forEach((child, i) => {
            // Target to insert before each line.
            const childExprLines = this.buildLines(child, [...path, slotNames[i]], childScope, 0);
            if (childExprLines.length) {
              childExprLines[0].beforeLineTarget = {
                type: DropTargetType.FULL_LINE,
                position: DropTargetPosition.BEFORE,
                id: genDropTargetId()
              };
              lines.push(...childExprLines);
            }
          });
          if (lines.length) {
            // Target to append to the end of the document.
            lines[lines.length - 1].afterLineTarget = {
              type: DropTargetType.FULL_LINE,
              position: DropTargetPosition.AFTER,
              id: genDropTargetId()
            };
          }
          break;

        case FUNCTION_CALL.name:
        case OP_ASSIGNMENT.name:
        case NEW.name:
          lines.push(new MetaLine(expr, path, optScope, indentCount));
          break;

          // TODO: Remaining expression types. Recurse block expressions.
        default:
          throw new Error(`NOT IMPLEMENTED: buildLines() for ${expr}.`);
      }
      return lines;
    }

    /**
     * Renders an expression as a single line. Defers to
     * CodeWordsJS.buildSpan(expr).
     * @param expr The expression to render.
     * @param path The reference path to the expression.
     * @return A new span representing the expression.
     */
    buildLineSpan(expr: Expression, path: string[]): Span {
      if (expr.language !== this) {
        throw new Error('Mismatched CodeLanguage. Found: ' + expr.language);
      }
      return CodeWordsJS.buildSpan(expr, path);
    }

    // Helper Functions
    /**
     * Convenience method for constructing an identifier.
     *
     * @param name The identifier string.
     * @param valueType The JavaScript value represented by the identifier.
     * @return A new IdentifierExpression.
     */
    identifier(name: string, valueType: JsValueType): IdentifierExpression {
      return this.newExpression(IDENTIFIER, {name, valueType}) as IdentifierExpression;
    }

    /**
     * Convenience method for constructing a number literal.
     *
     * @param value The value of the number literal.
     * @return A new NumberLiteralExpression.
     */
    numberLiteral(value: number): NumberLiteralExpression {
      return NUMBER_LITERAL.newExpression(this, {
        value,
        valueType: CodeWordsJS.TYPE_NUMBER
      }) as NumberLiteralExpression;
    }

    /**
     * Convenience method for constructing a string literal.
     *
     * @param value The value of the string literal.
     * @return A new StringLiteralExpression.
     */
    stringLiteral(value: string): StringLiteralExpression {
      return STRING_LITERAL.newExpression(this, {
        value,
        valueType: CodeWordsJS.TYPE_STRING
      }) as StringLiteralExpression;
    }

    /**
     * Convenience method for constructing a function call.
     *
     * @param callable The expression representing the function to call.
     * @param options The function parameters and return type. Empty and void by default.
     * @return A new FUNCTION_CALL expression.
     */
    // TODO: Allow identifier path string as first argument.
    functionCall(callable: Expression, options?: FunctionCallOptions): Expression {
      if (!callable) {
        throw new Error('functionCall missing callable expression');
      }
      let params = options && options.params;
      if (params && Array.isArray(params)) {
        // TODO: Validate all params are value expressions.
        params = this.newExpression(CALL_PARAMETERS, {
          children: params
        });
      } else if(params && params.type !== CALL_PARAMETERS) {
        const msg = 'Invalid params object: ';
        console.error(msg, params);
        throw new Error(msg + params);
      }
      return this.newExpression(FUNCTION_CALL, {
        children: {callable, params},
        valueType: (options && options.returnType) || TYPE_VOID
      });
    }

    /**
     * Convenience method for constructing a member path reference.
     *
     * @param members The members of the scoping path.
     * @return A new 'OP_MEMBER_REF' expression.
     */
    memberRef(...members: Expression[]) {
      if (members.length < 2) {
        throw new Error('Expected at least two members');
      }
      let ref = members[0];
      for (let i = 1; i < members.length; ++i) {
        ref = this.newExpression('OP_MEMBER_REF', {
          children: {
            parent: ref,
            child: members[i]
          }
        });
      }
      return ref;
    }

    /**
     * Convenience method for constructing a new object statement for a
     * referenced class.
     *
     * @param constructorExpr The expression representing the class constructor
     * @param optParams The parameters to pass to the function, if any
     * @return A new 'NEW' expression
     */
    newOperator(constructorExpr: Expression,
                ...optParams: Expression[]): Expression {
      const constructorType = constructorExpr.getValueType() as JsValueType;
      if (!constructorType) {
        throw new Error('constructorExpr missing JsValueType');
      }
      if (!constructorType.functionSpec || !constructorType.functionSpec.returnType) {
        throw new Error('constructorExpr missing FunctionSpec returnType.');
      }
      const newObjType = constructorType.functionSpec.returnType;
      if (optParams.length === 1 && optParams[0].type === CALL_PARAMETERS) {
        return this.newExpression('NEW', {
          children: {
            'class': constructorExpr,
            'params': optParams
          },
          valueType: newObjType
        });
      } else if (optParams.length) {
        // TODO: Validate all expressions are value expressions.
        return this.newExpression('NEW', {
          children: {
            'class': constructorExpr,
            'params': this.newExpression('CALL_PARAMETERS', {
              children: optParams
            })
          },
          valueType: newObjType
        });
      } else {
        return this.newExpression('NEW', {
          children: {
            'class': constructorExpr
          },
          valueType: newObjType
        });
      }
    }

    /**
     * Convenience method for constructing a new object statement for a named
     * class.
     *
     * FUTURE: Take in a namespaced class name (identifiers separated by dot
     * operators).
     *
     * @param className The name of the class to instantiate
     * @param constructorValueType The JavaScript object type this constructor
     *                             call creates.
     * @param optParams The parameters to pass to the function, if any
     * @return A new 'NEW' expression
     */
    newOperatorForClassname(className: string,
                            constructorValueType: JsValueType,
                            ...optParams: Expression[]): Expression {
      if (constructorValueType.flags !== JsValueTypeFlags.CONSTRUCTOR) {
        throw new Error('Expected CONSTRUCTOR for constructorValueType. ' +
                        'Found: ' + constructorValueType);
      }
      const objType = constructorValueType.functionSpec!.returnType;
      if (!objType) {
        throw new Error('Return type for constructor not found');
      }

      // TODO: If classname contains dots, split into identifiers and use memberRef()
      const identifier = this.identifier(className, constructorValueType);
      return this.newOperator(identifier, ...optParams);
    }
  }
}
