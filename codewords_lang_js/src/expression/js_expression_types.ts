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

/// <reference path="../../../codewords_core/build/codewords_core.d.ts" />

/// <reference path="identifier_expression.ts" />
/// <reference path="identifier_expression_type.ts" />
/// <reference path="number_literal_expression.ts" />
/// <reference path="string_literal_expression.ts" />

namespace CodeWordsJS {
  import AstDocumentType = CodeWords.AST.AstDocumentType;
  import DynamicSlotsExpressionType = CodeWords.AST.DynamicSlotsExpressionType;
  import FixedSlotsExpressionType = CodeWords.AST.FixedSlotsExpressionType;
  import LeafExpressionType = CodeWords.AST.LeafExpressionType;

  import IdentifierExpressionType = CodeWordsJS.IdentifierExpressionType;
  import JsValueType = CodeWordsJS.Value.JsValueType;


  /** TypeScript type hint for most binary operators. */
  export interface BinaryOpChildren {
    left: CodeWords.AST.Expression;
    right: CodeWords.AST.Expression;
  }

  /**
   * A sequence of statements between curly braces.
   */
  export const BLOCK = new DynamicSlotsExpressionType('BLOCK');

  export const CALL_PARAMETERS = new DynamicSlotsExpressionType('CALL_PARAMETERS');

  /**
   * The top level document.
   */
  export const DOCUMENT = new AstDocumentType('DOCUMENT');

  /**
   * A call to a function or other callable.
   */
  // TODO: Rename 'params' as 'parameters'
  export const FUNCTION_CALL = new FixedSlotsExpressionType('FUNCTION_CALL',
      ['callable', 'params']);

  export interface FunctionCallOptions {
    params?: CodeWords.AST.Expression | CodeWords.AST.Expression[];
    returnType?: JsValueType;
  }

  /**
   * A JavaScript identifier.
   */
  export const IDENTIFIER = new IdentifierExpressionType();

  /**
   * An call to an object constructor with the "new" keyword.
   */
  // TODO: Rename 'constructor' and 'parameters' (or 'arguments')
  export const NEW = new FixedSlotsExpressionType('NEW',
      ['class', 'params']);

  export interface NewOperatorChildren {
    'class': CodeWords.AST.Expression;
    params?: CodeWords.AST.Expression;
  }

  /**
   * A literal number
   */
  export const NUMBER_LITERAL = new LeafExpressionType('NUMBER_LITERAL',
      (language, exprType, value) =>
          new NumberLiteralExpression(language, exprType, value));

  /**
   * An assignment ('=' operator) to a variable or constant.
   */
  export const OP_ASSIGNMENT = new FixedSlotsExpressionType('OP_ASSIGNMENT',
      ['left', 'right']);

  /**
   * A reference to an object member via the dot operator '.'.
   */
  export const OP_MEMBER_REF = new FixedSlotsExpressionType('OP_MEMBER_REF',
      ['parent', 'child']);

  export interface MemberRefChildren {
    parent: CodeWords.AST.Expression;
    child: CodeWords.AST.Expression;
  }

  /**
   * A literal string.
   */
  export const STRING_LITERAL = new LeafExpressionType('STRING_LITERAL',
      (language, exprType, value) =>
          new StringLiteralExpression(language, exprType, value));
}
