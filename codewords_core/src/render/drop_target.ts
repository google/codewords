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
/// <reference path="../snippet/snippet.ts" />
/// <reference path="../snippet/snippet_context.ts" />
/// <reference path="../snippet/insertion_edit.ts" />


namespace CodeWords.Render {
  import Expression = CodeWords.AST.Expression;

  export enum DropTargetType {
    /**
     * For drop target rendered inline, as subexpressions.
     */
    INLINE = 'INLINE',

    /**
     * For drop target rendered as individual lines.
     */
    FULL_LINE = 'FULL_LINE'
  }

  /**
   * The placement of the drop target area, relative to the Span or MetaLine.
   * These hint to the renderer about how the space should be adapted.
   *
   * These positions are strictly visual. While there is no enforcement or
   * guarantee about how snippet should be inserted in the AST, developers
   * should aim for edits that the user will perceive as matching the position.
   *
   * For example, converting "1" to "1 + 2" will look like placing "+ 2" after
   * the "1", even though it is actually replacing the number literal with an
   * addition operator.
   */
  export enum DropTargetPosition {
    /**
     * Just before the content of this span, or between this and the previous
     * line.
     */
    BEFORE = 'BEFORE',

    /**
     * Anywhere on this span or line, usually with the intention of replacing
     * it.
     */
    REPLACE = 'REPLACE',

    /**
     * Just after the content of this span, or between this and the next line.
     */
    AFTER = 'AFTER'
  }

  /**
   * The function prototype used to potentially mutate a InsertionEdit created
   * by a Snippet at a particular location.
   *
   * @param edit The original edit proposed by the snippet.
   * @param context The context within which the snippet exists, including the document.
   * @param dropTargetInfo The drop target and relevant expressions.
   */
  export type MutateSnippetInsertionEditFn =
      (edit: Snippet.InsertionEdit,
       context: Snippet.SnippetContext,
       targetInfo: DropTargetWithExpressions) => Snippet.InsertionEdit;

  /**
   * An annotation of a Span or MetaLine, identifying it as a potential
   * location on screen when the user can drop a snippet.
   *
   * DropTargets are constructed and attached by the CodeLanguage buildLines()
   * and buildLineSpan() functions.
   */
  export interface DropTarget {
    /** The type of the drop target, inline or full line. */
    type: DropTargetType;

    /**
     * The position of the drop target, relative to the referenced path.
     */
    position: DropTargetPosition;

    /**
     * Location specific function to mutate or veto the snippet. For example,
     * promote or constrain possible function parameters.
     */
    // QUESTION: Should this be a string key for a lookup table of functions?
    //           It would allow serialization (quickly restore a view from
    //           localStorage) and disconnect load order dependencies. It may
    //           also increase reuse across support libraries, the way
    //           Blockly's named mutators do.
    //           The CONs include the execution cost of the indirection,
    //           reduced type checking, and potential namespace collisions.
    mutateInsertionEdit?: MutateSnippetInsertionEditFn;

    /** Absolute path to the reference expression. */
    path?: string[];

    /**
     * An id for the drop target, unique within the scope of the document and
     * the session. Primarily used as an id on HTML elements, to look up the
     * drop target info.
     *
     * See genDropTargetId()
     */
    id: string;
  }

  /**
   * A drop target paired with its rendered location in HTML. The html may not
   * have been added to the document.
   */
  export interface DropTargetWithHtml extends DropTarget {
    // The following are always defined.
    path: string[];
    html: HTMLElement;
  }

  /**
   * A DropTarget annotated with its referenced expression, and possible expression
   * parent. This is passed into Snippet.maybeBuildInsertionEdit(..) and
   * DropTarget.mutateInsertionEdit(..) during calculateSnippets(..).
   *
   * One of expr and parent must always be defined, often both.
   */
  export interface DropTargetWithExpressions extends DropTargetWithHtml {
    /**
     * The expression referenced by the target's path, if it exists. The
     * expression may not exist if the path refers to a unfilled expression
     * slot, such as the else body of an if expression.
     */
    expr?: Expression;

    /**
     * The parent of the referenced expression if expr is not the document
     * root.
     */
    parent?: Expression;
  }

  /**
   * Map of DropTargets by their string id, for easy lookup.
   */
  export interface DropTargetsById {
    [key: string]: Render.DropTargetWithHtml;
  }

  /**
   * Constructs a new Span with the declared type of drop target.
   * @param position The relative position of the drop target.
   * @param expr The expr the drop target refers to.
   * @param path The path to the referenced expression. Possibly relative.
   * @return A newly constructed span, annotated with a given drop target.
   */
  // TODO: Rename as dropTargetSpan
  export function dropTarget(type: DropTargetType,
                             position: DropTargetPosition,
                             expr?: AST.Expression,
                             path?: string[]) {
    const span = new Span(expr, path);
    span.dropTarget = {type, position, id: genDropTargetId()};
    return span;
  }

  let dropTargetIdCount = 0;

  export function genDropTargetId(): string {
    return 'cwdt' + (++dropTargetIdCount);
  }
}