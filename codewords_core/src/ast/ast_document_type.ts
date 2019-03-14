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

/// <reference path="expression_type.ts" />
/// <reference path="dynamic_slots_expression_type.ts" />
/// <reference path="expression.ts" />
/// <reference path="ast_document.ts" />

namespace CodeWords.AST {
  /**
   * ExpressionType for AstDocument expressions.
   *
   * <pre><code>
   * // Create the document ExpressionType. Pass it into the CodeLanguage.
   * const DOCUMENT = new AstDocumentType('document');
   * const LANGUAGE = new CodeLanguage('Example', [DOCUMENT]);  // TODO: Add more types.
   *
   * // There are two ways to create the AstDocument expression:
   * let document1 = DOCUMENT.newExpression(LANGUAGE,
   *     { // Optionally assign children immediately
   *       children: [
   *         firstChildExpression,
   *         secondChildExpression
   *       ]
   *     });
   * let document2 = LANGUAGE.newExpression('document',
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
   *                     AstDocumentType.DefaultFactoryFn(..).
   */
  export class AstDocumentType extends DynamicSlotsExpressionType {
    constructor(name: string,
                optFactoryFn?: ExpressionFactoryFn) {
      super(name, optFactoryFn || AstDocumentType.DefaultFactoryFn);
    }

    /**
     * Default AstDocumentType factory function.
     *
     * @param language The language this document type belongs to.
     * @param type The document type.
     * @param options An optional configuration object.
     */
    static DefaultFactoryFn(language: CodeLanguage,
                            type: AstDocumentType,
                            options?: DynamicSlotsOptions): Expression {
      // Check type (because JavaScript)
      if (!(type instanceof CodeWords.AST.AstDocumentType)) {
        throw new Error('ExpressionType is not AstDocumentType');
      }
      return new AstDocument(language, type, options);
    }
  }
}