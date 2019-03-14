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

namespace CodeWordsJS {
  import CodeLanguage = CodeWords.CodeLanguage;
  import ExpressionOptions = CodeWords.AST.ExpressionOptions;
  import ExpressionType = CodeWords.AST.ExpressionType;
  import LeafExpression = CodeWords.AST.LeafExpression;

  import JsValueType = CodeWordsJS.Value.JsValueType;

  export interface IdentifierExpressionConfig extends ExpressionOptions {
    /** The identifier name. */
    name: string;

    /** The ValueType of represented by this identifier. */
    valueType: JsValueType;
  }

  export class IdentifierExpression extends LeafExpression {
    name: string;

    constructor(language: CodeLanguage,
                type: ExpressionType,
                config: IdentifierExpressionConfig) {
      super(language, type, config);

      if (typeof name !== 'string') {
        throw new Error(`Expected a name. Found: ${name} (${typeof name})`);
      }
      // TODO: Validate identifier string.
      this.name = config.name;

      Object.freeze(this);
    }

    /**
     * Implements Expression.makeShallowClone() with an optional change in
     * value type.
     */
    makeShallowClone(optValueType?: JsValueType) {
      const options = this.makeShallowCloneOptions();
      return new IdentifierExpression(this.language, this.type, options);
    }

    /**
     * Implements Expression.makeShallowCloneOptions() with an optional change
     * in value type.
     */
    makeShallowCloneOptions(optValueType?: JsValueType): IdentifierExpressionConfig {
      return {
        ...this.makeShallowCloneOptions(),
        name: this.name,
        valueType: optValueType || this.getValueType() as JsValueType,
      };
    }
  }
}
