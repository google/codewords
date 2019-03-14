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
/// <reference path="./abstract_expression_snippet.ts" />

namespace CodeWordsJS.Snippet {
  import Expression = CodeWords.AST.Expression;
  import DropTargetPosition = CodeWords.Render.DropTargetPosition;
  import DropTargetWithExpressions = CodeWords.Render.DropTargetWithExpressions;
  import InsertionEdit = CodeWords.Snippet.InsertionEdit;
  import InsertionType = CodeWords.Snippet.InsertionType;

  /**
   * A snippet that inserts a line expression into a execution  context.
   * "Execution context" may include a function, method, or at the document's
   * top level, but should not include inside class definitions.
   */
  export class StatementSnippet extends AbstractExpressionSnippet {
    constructor(protected readonly expr_: Expression,
                protected defaultPriority_ = 100) {
      super(expr_, defaultPriority_);
    }

    // Override
    maybeBuildInsertionEdit(dropTarget: DropTargetWithExpressions): InsertionEdit | null {
      const {parent} = dropTarget;
      if (parent &&
          parent.language === this.lang_ &&
          isExecutionContext(parent)) {
        // Edit type
        const type = insertionTypeForTargetType(dropTarget.position);
        const path = dropTarget.path;
        return {
          type, path,
          priority: this.getPriority(dropTarget),
          expressions: [this.expr_]
        };
      }
      return null;
    }
  }

  function isExecutionContext(expr: Expression) {
    // TODO: other block contexts: function declaration, if body, loop body
    return expr.type === CodeWordsJS.DOCUMENT;
  }

  function insertionTypeForTargetType(targetPosition: DropTargetPosition) {
    switch(targetPosition) {
      case DropTargetPosition.BEFORE:
        return InsertionType.BEFORE;
      case DropTargetPosition.REPLACE:
        return InsertionType.REPLACE;
      case DropTargetPosition.AFTER:
        return InsertionType.AFTER;

      default:
        throw new Error('Unrecognized DropTargetPosition: ' + targetPosition);
    }
  }
}
