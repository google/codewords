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
/// <reference path="./expression/js_expression_types.ts" />
/// <reference path="./javascript_code.ts" />

namespace CodeWordsJS {
  export const ES6: CodeWords.CodeLanguage = new JavaScriptCode('CodeWordsJS.ES6', [
        BLOCK,
        CALL_PARAMETERS,
        DOCUMENT,
        FUNCTION_CALL,
        IDENTIFIER,
        NEW,
        NUMBER_LITERAL,
        OP_MEMBER_REF,
        OP_ASSIGNMENT,
        STRING_LITERAL,
      ]);
}
