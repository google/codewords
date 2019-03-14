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

  export interface NumberLiteralConfig extends ExpressionOptions {
    value: number;
    codeString?: string;
  }

  export class NumberLiteralExpression extends LeafExpression {
    value: number;  // TODO: Question: Does the AST need the value?
    codeString: string;

    constructor(language: CodeLanguage,
                type: ExpressionType,
                config: NumberLiteralConfig) {
      super(language, type, {...config, valueType: TYPE_NUMBER} as ExpressionOptions);

      const {value, valueType} = config;
      if (typeof value !== 'number') {
        throw new Error(`Expected a number value. Found: ${value} (${typeof value})`);
      }

      if (valueType && valueType !== TYPE_NUMBER) {
        throw new Error('Only allow config.valueType is TYPE_NUMBER. Found: ' + valueType);
      }
      this.value = value;
      this.codeString = config.codeString || ('' + value);

      Object.freeze(this);
    }

    /** Implements Expression.makeShallowClone(). */
    makeShallowClone(): NumberLiteralExpression {
      const config = this.makeShallowCloneOptions();
      return new NumberLiteralExpression(this.language, this.type, config);
    }

    /** Implements Expression.makeShallowCloneOptions. */
    makeShallowCloneOptions(): NumberLiteralConfig {
      return {
        ...super.makeShallowCloneOptions(),
        value: this.value,
        codeString: this.codeString,
      };
    }
  }
}
