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

namespace CodeWordsJS.Snippet {
  import CodeLanguage = CodeWords.CodeLanguage;
  import Expression = CodeWords.AST.Expression;
  import DropTargetWithExpressions = CodeWords.Render.DropTargetWithExpressions;
  import Span = CodeWords.Render.Span;
  import InsertionEdit = CodeWords.Snippet.InsertionEdit;
  import Snippet = CodeWords.Snippet.Snippet;

  /**
   * A convenience base class for snippets that represent a single expression.
   * By default, it uses the language's default rendering for the display span.
   */
  export abstract class AbstractExpressionSnippet implements Snippet {
    protected lang_: CodeLanguage;
    protected display_?: Span[];

    constructor(protected readonly expr_: Expression,
                protected defaultPriority_: number) {
      this.lang_ = expr_.language;
    }

    // Override
    getValueType() {
      return this.expr_.getValueType();
    }

    // Copied from Snippet.
    abstract maybeBuildInsertionEdit(dropTarget: DropTargetWithExpressions)
    : InsertionEdit | null;

    /**
     * Gets the priority for a specific insertion target. By default, it uses
     * a value derived from the default priority passed into the constructor.
     *
     * Snippets that adapt to the user's search terms probably want to override
     * this method to adapt priority, too.
     *
     * @param target The DropTarget with relevant expressions.
     * @return The priority for the InsertionEdit to be created.
     */
    getPriority(target: DropTargetWithExpressions): number {
      return this.defaultPriority_;
    }

    /**
     * Implements Snippet.getDisplaySpans using the language's rendered span of
     * the expression.
     * @return A single span for the value expression.
     */
    getDisplaySpans(): Span[] {
      if (!this.display_) {
        this.display_ = [this.lang_.buildLineSpan(this.expr_!, [])];
      }
      return this.display_;
    }
  }
}
