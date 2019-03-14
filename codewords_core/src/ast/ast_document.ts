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

/// <reference path="../code_language.ts" />
/// <reference path="../render/meta_line.ts" />

/// <reference path="./dynamic_slots_expression.ts" />
/// <reference path="./expression_type.ts" />
/// <reference path="./scope.ts" />

namespace CodeWords.AST {
  /**
   * Top level Expression, which maps all expressions to their respective lines of code.
   */
  export class AstDocument extends DynamicSlotsExpression {
    /** The type definition of the expression. (Type narrowing of Expression.type.) */
    readonly type: AstDocumentType;

    /**
     * @param language The language this expression is part of.
     * @param docTypeOrTypeName The document type definition or the type name.
     * @param options The configuration object to initialize this document.
     */
    constructor(language: CodeLanguage,
                docTypeOrTypeName: AstDocumentType | string,
                options?: DynamicSlotsOptions) {
      // TODO: If docTypeOrTypeName is a string, verify it refers to a AstDocumentType
      super(language, docTypeOrTypeName, options);
    }

    /**
     * Constructs a sequence of MetaLines reflecting the expressions in this
     * document.
     * @return Newly constructed sequence of MetaLines for this document.
     */
    getMetaLines(): Render.MetaLine[] {
      return this.language.buildLines(this, [], this.getContainerScope(), 0);
    }

    /**
     * Implements Expression.makeShallowClone(), returning a new
     * AstDocument with the same slots and children.
     *
     * @return A new AstDocument with the same slots and children.
     */
    makeShallowClone(): DynamicSlotsExpression {
      const options = this.makeShallowCloneOptions();
      return new AstDocument(
          this.language,
          this.type,
          options);
    }
  }
}
