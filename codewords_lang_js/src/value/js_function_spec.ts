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

namespace CodeWordsJS.Value {
  import Expression = CodeWords.AST.Expression;

  export interface AutocompleteFunctionCall {
    args: Expression[];
    score: number;
  }

  /**
   * A specification for the arguments and return type of a callable object.
   */
  export interface JsFunctionSpec {
    returnType: JsValueType;
    args: JsValueType[];
    autocompletions: AutocompleteFunctionCall[];
  }
}