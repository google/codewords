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

  export interface StringLiteralConfig extends ExpressionOptions {
    value: string;
    quotedAndEscaped?: string;
  }

  export class StringLiteralExpression extends LeafExpression {
    value: string;
    quotedAndEscaped: string;

    constructor(language: CodeLanguage,
                type: ExpressionType,
                config: StringLiteralConfig) {
      super(language, type, {...config, valueType: TYPE_STRING} as ExpressionOptions);

      const {value, valueType} = config;
      if (typeof value !== 'string') {
        throw new Error(`Expected a string value. Found: ${value} (${typeof value})`);
      }
      if (valueType && valueType !== TYPE_STRING) {
        throw new Error('Only allow config.valueType is TYPE_STRING. Found: ' + valueType);
      }

      this.value = value;
      // TODO: Auto escaping, if necessary
      this.quotedAndEscaped = config.quotedAndEscaped || `'${value}'`;

      Object.freeze(this);
    }

    /** Implements Expression.makeShallowClone(). */
    makeShallowClone(): StringLiteralExpression {
      const options = this.makeShallowCloneOptions();
      return new StringLiteralExpression(this.language, this.type, options);
    }

    /** Implements Expression.makeShallowCloneOptions(). */
    makeShallowCloneOptions(): StringLiteralConfig {
      return {
        ...super.makeShallowCloneOptions(),
        value: this.value,
        quotedAndEscaped: this.quotedAndEscaped,
      };
    }
  }
}
