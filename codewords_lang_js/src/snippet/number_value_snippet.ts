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
   * A snippet that inserts a number value expression, and can be assigned to
   * any any location that expects a number. It will prepend and postpend with
   * other numbers via addition. It can also also concatenate with string
   * literals.
   */
  // TODO: prepend with number values.
  // TODO: postpend with number values.
  // TODO: postpend with string literals.
  export class NumberValueSnippet extends AbstractExpressionSnippet {
    constructor(protected readonly expr_: Expression,
                protected defaultPriority_ = 1000) {
      super(expr_, defaultPriority_);
    }

    // Override
    maybeBuildInsertionEdit(dropTarget: DropTargetWithExpressions): InsertionEdit | null {
      const {expr} = dropTarget;
      if (expr &&
          expr.language === this.lang_ &&
          expr.type === NUMBER_LITERAL) {
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
     * @param target The DropTarget with relevant position and expressions.
     */
    getPriority(target: DropTargetWithExpressions)
    : number {
      switch (target.position) {
        case DropTargetPosition.REPLACE:
          // TODO: Number Placeholder * 2
          return this.defaultPriority_;

        case DropTargetPosition.BEFORE:
        case DropTargetPosition.AFTER:
          return this.defaultPriority_ / 90;

        default:
          throw new Error('Unrecognized DropTargetPosition: ' + target.position);
      }
    }
  }
}
