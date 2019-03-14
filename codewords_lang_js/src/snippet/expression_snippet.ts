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
  import AstDocument = CodeWords.AST.AstDocument;
  import Expression = CodeWords.AST.Expression;
  import DropTargetPosition = CodeWords.Render.DropTargetPosition;
  import DropTargetWithExpressions = CodeWords.Render.DropTargetWithExpressions;
  import InsertionEdit = CodeWords.Snippet.InsertionEdit;

  import JsValueType = CodeWordsJS.Value.JsValueType;
  import InsertionType = CodeWords.Snippet.InsertionType;


  export class ExpressionSnippet extends AbstractExpressionSnippet {
    private valueType_: JsValueType | undefined;
    private isFunction_: boolean;
    private canBeValue_: boolean;
    private canBeStatement_: boolean;

    constructor(readonly expr_: Expression,
                readonly defaultPriority_: number) {
      super(expr_, defaultPriority_);
      this.valueType_ = expr_.getValueType() as JsValueType;

      this.isFunction_ = this.valueType_ && this.valueType_.isFunction();
      this.canBeValue_ = this.valueType_ && this.valueType_ !== CodeWordsJS.TYPE_VOID;
      this.canBeStatement_ = true;  // TODO: In .js everything is a statement. How to be intelligent?
    }


    // Override
    maybeBuildInsertionEdit(dropTarget: DropTargetWithExpressions): InsertionEdit | null {
      const {expr, parent, path, position} = dropTarget;
      if (expr && expr.language === this.lang_) {
        const exprValueType = expr && expr.getValueType();
        if (this.canBeValue_ &&
            exprValueType && exprValueType.isAssignableFrom(this.valueType_!)) {
          // Edit type
          const type = InsertionType.REPLACE;
          switch (position) {
              // TODO: prepend
            case DropTargetPosition.REPLACE:
              return {
                type, path,
                priority: this.getPriority(dropTarget),
                expressions: [this.expr_]
              };
            default:
              // No match
          }
        }
        if (this.canBeStatement_ && parent && parent instanceof AstDocument) {
          switch (position) {
            case DropTargetPosition.BEFORE:
              return {
                path, type: InsertionType.BEFORE,
                priority: this.getPriority(dropTarget),
                expressions: [this.expr_]
              };
            case DropTargetPosition.AFTER:
              return {
                path, type: InsertionType.AFTER,
                priority: this.getPriority(dropTarget),
                expressions: [this.expr_]
              };
            default:
              // No match
          }
        }
      }
      return null;
    }
  }
}
