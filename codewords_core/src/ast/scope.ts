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

namespace CodeWords.AST {
  /**
   * An abstract container for variables, functions, and type declaractions.
   * Usually hierarchical, with a root scope registered at the document level,
   * and the declarations in the parent scope are often available to the local
   * scope.
   */
  export interface Scope {
    /**
     * The Scope to search if this scope does not contain a match. The parent
     * could be a parent container (e.g., the context containing an inline
     * function definition), or a super class (when searching for a member).
     */
    parent: Scope | undefined;
    // TODO: Revert back to Scope | null. _Defined_ as null is more accurate.
    // TODO: Is there a language neutral way to query members and declarations?
  }
}