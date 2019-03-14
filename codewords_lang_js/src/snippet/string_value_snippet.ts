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
/// <reference path="../expression/js_expression_types.ts" />
/// <reference path="../snippet/abstract_expression_snippet.ts" />

namespace CodeWordsJS.Snippet {
  import Expression = CodeWords.AST.Expression;
  import DropTargetPosition = CodeWords.Render.DropTargetPosition;
  import DropTargetWithExpressions = CodeWords.Render.DropTargetWithExpressions;
  import InsertionEdit = CodeWords.Snippet.InsertionEdit;
  import InsertionType = CodeWords.Snippet.InsertionType;

  /**
   * A snippet that inserts a string value expression, and can be assigned to
   * any any location that expects a string. It will prepend and postpend with
   * other string values via concatenation. It can also also prepend with most
   * literals.
   *
   * By default, this is a low priority match, since the string can be anything.
   */
  // TODO: prepend with number values.
  // TODO: postpend with number values.
  // TODO: postpend with string literals.
  export class StringValueSnippet extends AbstractExpressionSnippet {
    constructor(protected readonly expr_: Expression,
                protected defaultPriority_ = 10) {
      super(expr_, defaultPriority_);
    }

    // Override
    maybeBuildInsertionEdit(dropTarget: DropTargetWithExpressions): InsertionEdit | null {
      const {expr} = dropTarget;
      if (expr &&
          expr.language === this.lang_ &&
          expr.type === STRING_LITERAL) {
        // Edit type
        const type = InsertionType.REPLACE;
        const path = dropTarget.path;
        switch (dropTarget.position) {
            // TODO: prepend
          case DropTargetPosition.REPLACE:
            return { type, path,
              priority: this.getPriority(dropTarget),
              expressions: [this.expr_]
            };
          default:
            // No match
        }
      }
      return null;
    }

    /**
     * Gets the priority for a specific insertion target. By default, it uses
     * a value derived from the default priority passed into the constructor.
     *
     * @param target The DropTarget with relevant expressions.
     * @return The priority for the InsertionEdit to be created.
     */
    getPriority(target: DropTargetWithExpressions)
    : number {
      switch (target.position) {
        case DropTargetPosition.REPLACE:
          // TODO: *2 if expr is a string value placeholder
          // TODO: /2 if expr not a string literal
          return this.defaultPriority_;

        case DropTargetPosition.BEFORE:
        case DropTargetPosition.AFTER:
          return this.defaultPriority_ / 10;

        default:
          throw new Error('Unrecognized DropTargetPosition: ' + target.position);
      }
    }
  }
}
