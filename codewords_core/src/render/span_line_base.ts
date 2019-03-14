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

/// <reference path="../ast/expression.ts" />
/// <reference path="./token.ts" />

namespace CodeWords.Render {
  /**
   * Base interface for properties shared by Span and MetaLine.
   */
  // TODO: Refactor to use an options object.
  //       Maybe prefer an interface / factory function combo. (Has no methods.)
  export class SpanLineBase {
    constructor(/** expr The root expression of this span. */
                public expr?: AST.Expression,
                /** path The document path to the root expression. */
                public path?: string[],
                public clickHandlerIds?: string[])
    {}
  }
}