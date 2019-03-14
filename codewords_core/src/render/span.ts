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
/// <reference path="./span_line_base.ts" />
/// <reference path="./token.ts" />

namespace CodeWords.Render {
  export type Part = string | Token | Span; // TODO: LineBreakHint, Line

  export class Span extends SpanLineBase {
    parts: Part[] = [];

    /** A DropTarget attached to this location. */
    dropTarget?: DropTarget;

    // TODO: Snippet drop-target location and transformation hints.
    // TODO: Help reference key

    // TODO: Refactor to use an options object.
    //       Maybe prefer an interface / factory function combo. (Has no methods.)
    constructor(expr?: AST.Expression, path?: string[], clickHandlerIds?: string[]) {
      super(expr, path, clickHandlerIds);
    }

    append(...parts: Part[]) {
      // TODO: Validate?
      this.parts.push(...parts);
    }
  }
}