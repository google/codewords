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

namespace CodeWordsJS.Value {
  export enum JsValueTypeFlags {
    /**
     * Return type of a statement that never returns, such as a throw
     * statements or an infinite loop.
     */
    NEVER = 0,

    // Primitive values. Not composable.
    UNDEFINED = (1 << 0),
    NULL = (1 << 1),
    BOOLEAN = (1 << 2),
    NUMBER = (1 << 3),
    STRING = (1 << 4),

    // TODO: Symbol

    // Object types
    /** Any type that can have properties. */
    OBJECT = (1 << 8),

    /** An object created by the Boolean constructor. */
    BOOLEAN_OBJ = BOOLEAN | OBJECT,

    /** An object created by the Number constructor. */
    NUMBER_OBJ = NUMBER | OBJECT,

    /** An object created by the String constructor. */
    STRING_OBJ = STRING | OBJECT,

    /** An object that is a container of other values, and never meant to be used alone. */
    NAMESPACE = (1 << 9) | OBJECT,

    /** An object with integer keys (usually sequential starting from 0), and a length property. */
    ARRAY = (1 << 10) | OBJECT,

    /** A callable object. */
    FUNCTION = (1 << 11) | OBJECT,

    /** A function that can be called with the new operator to construct a new object. */
    CONSTRUCTOR = (1 << 12) | FUNCTION
  }
}
