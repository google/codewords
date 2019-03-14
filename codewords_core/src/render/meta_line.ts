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

namespace CodeWords.Render {
  import Expression = CodeWords.AST.Expression;
  import Scope = CodeWords.AST.Scope;

  /**
   * The AST references and other metadata necessary to render a single line of
   * code.
   *
   * MetaLines are are created via a call to {@link CodeLanguage#buildLines},
   * which will analyze sequence of {@link Expression Expressions} for line
   * breaks. This analysis occurs before rendering and view constraints, so
   * does not include line breaks necessary to wrap long lines.
   */
  export class MetaLine extends SpanLineBase {
    /**
     * The scope within which the line expressions exist. This it defines what
     * variables are visible to the expressions.
     */
    readonly scope: Scope | undefined;

    /** The root expression of this line. Implements SpanLineBase. */
    readonly expr: Expression;

    /** The document path to the root expression. Implements SpanLineBase. */
    readonly path: string[];

    /** A DropTarget that may insert a line before this one. */
    beforeLineTarget?: BeforeLineTarget;

    /** A DropTarget that may insert a line after this one. */
    afterLineTarget?: AfterLineTarget;


    /** Number of indents to use when rendering this line as a string. */
    readonly indentCount: number;

    /**
     * Constructs a MetaLine with {@code rootExpr} as its primary expression.
     *
     * @param rootExpr The primary expression of the line.
     * @param path The path of slot names that address the root expression of
     *             this line within the document.
     * @param optScope The scope containing these expressions.
     * @param optIndentCount The count of indents/tabs to use when rendering
     *                       this line to a string.
     * @param optClickHandlerIds List of all click handler ids in this line.
     */
    // TODO: Refactor to use an options object.
    //       Maybe prefer an interface / factory function combo. (Has no methods.)
    constructor(rootExpr: Expression,
                path: string[],
                optScope?: Scope,
                optIndentCount?: number,
                optClickHandlerIds?: string[]) {
      super(rootExpr, Object.freeze(path) as string[], optClickHandlerIds);
      this.scope = optScope;
      if (!rootExpr || !path) {
        throw new Error('Requires root Expression and path.');
      }

      this.indentCount = optIndentCount || 0;
    }

    // TODO: Pass in editor state that might affect rendering.
    //       E.g., selection range, closest drop target.
    buildLineSpan(): Span {
      return this.expr.language.buildLineSpan(this.expr, this.path);
    }
  }

  /**
   * A MetaLine rendered to HTML, with links to all drop target HTML within.
   *
   * Instances must retain enough data to be rerendered. For instance, a font
   * size change will not affect the document contents, but the MetaLines
   * should be remeasured and rendered to capture changes in line breaks.
   */
  export interface RenderedMetaLine {
    /**
     * The scope within which the line expressions exist. This defines what
     * variables are visible to the expressions.
     */
    readonly scope: Scope | undefined;

    /**
     * The HTML for this line. This does not include the before or after target
     * divs.
     */
    readonly html: HTMLElement;

    /** Convenience array to all drop targets associated with this line, in order. */
    readonly dropTargets: DropTargetWithHtml[];

    /** A drop target that may insert a line before this one. */
    readonly beforeLineTarget?: BeforeLineTargetWithHTML;

    /** All drop targets associated with this line, in order. */
    readonly inlineTargets: DropTargetWithHtml[];

    /** A drop target that may insert a line after this one. */
    readonly afterLineTarget?: AfterLineTargetWithHtml;

    // TODO: The width of longest rendered line in the rendered MetaLine.
    //       readonly charWidth: number;
  }

  /**
   * Constructs a list of top level scopes from the given list of lines.
   *
   * @param metalines The lines to query.
   * @return A list of all top level scopes.
   */
  export function scopesForLines(visibleLines: RenderedMetaLine[]) {
    return visibleLines.reduce((accum: Scope[], line: RenderedMetaLine) => {
      const scope: Scope | undefined = line.scope;
      if (scope && accum.indexOf(scope) === -1) {
        accum.push(scope);
      }
      return accum;
    }, [] as Scope[]);
  }

  /** DropTarget with enforced position enforced to 'before'. */
  export interface BeforeLineTarget extends DropTarget {
    position: DropTargetPosition.BEFORE;
  }

  /** DropTargetWithHtml with enforced position enforced to 'after'. */
  export interface BeforeLineTargetWithHTML extends DropTargetWithHtml {
    position: DropTargetPosition.BEFORE;
  }

  /** DropTarget with enforced position enforced to 'after'. */
  export interface AfterLineTarget extends DropTarget {
    position: DropTargetPosition.AFTER;
  }

  /** DropTargetWithHtml with enforced position enforced to 'after'. */
  export interface AfterLineTargetWithHtml extends DropTargetWithHtml {
    position: DropTargetPosition.AFTER;
  }
}


// TODO: Does the web implementation benefit from a line id? No RecyclerView.
// public class MetaLine<ExprEnum extends Enum> {
//   private static long NEXT_ID = 0;
//
//   /** Unique id used to preserve view mappings in the RecyclerView. */
//   private final long mId = NEXT_ID++;
//
//   /**
//    * An instance id that is unique across all MetaLine instances in this process. Used to uniquely
//    * distinguish the line in RecyclerViews. Should never be used in serialization.
//    *
//    * @return This line's instance id.
//    */
//   public long getId() {
//     return mId;
//   }
// }
