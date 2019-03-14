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

/// <reference path="./value/js_value_type.ts" />
/// <reference path="./value/js_value_type_flags.ts" />

namespace CodeWordsJS {
  import JsValueType = CodeWordsJS.Value.JsValueType;

  export const TYPE_UNDEFINED =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.UNDEFINED, {devName: 'undefined'});
  // While void is technically an operator in JavaScript, including a void type
  // synonym for undefined allows decalring functions that return "void", in a
  // manner similar to C/C++/Java.
  export const TYPE_VOID = TYPE_UNDEFINED;

  export const TYPE_NULL =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.NULL, {devName: 'null'});

  export const TYPE_BOOLEAN =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.BOOLEAN, {devName: 'boolean'});
  export const TYPE_BOOLEAN_OBJ =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.BOOLEAN_OBJ, {devName: 'Boolean'});

  export const TYPE_NUMBER =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.NUMBER, {devName: 'number'});
  export const TYPE_NUMBER_OBJ =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.NUMBER_OBJ, {devName: 'Number'});

  export const TYPE_STRING =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.STRING, {devName: 'string'});
  export const TYPE_STRING_OBJ =
      new JsValueType(CodeWordsJS.Value.JsValueTypeFlags.STRING_OBJ, {devName: 'String'});
}