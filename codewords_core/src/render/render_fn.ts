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

/// <reference path="../code_language.ts" />
/// <reference path="../snippet/snippet.ts" />
/// <reference path="./meta_line.ts" />
/// <reference path="./span.ts" />

namespace CodeWords.Render {
  import BEFORE = CodeWords.Render.DropTargetPosition.BEFORE;
  import AFTER = CodeWords.Render.DropTargetPosition.AFTER;

  import FULL_LINE = CodeWords.Render.DropTargetType.FULL_LINE;

  /** Intermediate result during renderHtmlSpan recursion. Not exported. */
  interface HtmlWithDropTargets {
    html: HTMLElement;
    dropTargets?: DropTargetWithHtml[];
  }

  /**
   * Function prototype to render a Snippet to a HTML display:block element for
   * the SnippetPalette.
   */
  export type RenderSnippetFn = (snippet: Snippet.Snippet) => RenderedMetaLine;

  /**
   * Renders a single MetaLine to a new HTML <div>. Simultaneously accumulates
   * a list of DropTargets within that line.
   */
  export function renderLine(metaline: MetaLine): RenderedMetaLine {
    const scope = metaline.scope;
    const span = metaline.buildLineSpan();

    // TODO: Calculate available character width for line indent, breaks, etc
    // TODO: Calculate click handlers for parent/ancestor expressions.
    const html = document.createElement('div');
    html.classList.add('codewords-codeline');

    const spanResult = renderHtmlSpan(span, true, true, metaline.expr, metaline.path);
    html.appendChild(spanResult.html);

    const dropTargets: DropTargetWithHtml[] = [];
    let inlineTargets: DropTargetWithHtml[] = [];
    let beforeLineTarget: BeforeLineTargetWithHTML | undefined = undefined;
    if (metaline.beforeLineTarget) {
      beforeLineTarget = renderLineDropTarget(
          metaline, BEFORE, metaline.beforeLineTarget.id) as BeforeLineTargetWithHTML;
      dropTargets.push(beforeLineTarget);
    }
    if (spanResult.dropTargets) {
      inlineTargets = spanResult.dropTargets;
      dropTargets.push(...inlineTargets);
    }
    let afterLineTarget: AfterLineTargetWithHtml | undefined = undefined;
    if (metaline.afterLineTarget) {
      afterLineTarget = renderLineDropTarget(
          metaline, AFTER, metaline.afterLineTarget.id) as AfterLineTargetWithHtml;
      dropTargets.push(afterLineTarget);
    }

    return { scope, html, dropTargets, inlineTargets, beforeLineTarget, afterLineTarget };
  }

  /**
   * Default RenderSnippetFn used on normal web pages.
   *
   * @param snippet The snippet to render, with spans already created.
   */
  export function renderSnippet(snippet: Snippet.Snippet): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('cw-snippet');
    for (const line of snippet.getDisplaySpans()) {
      const lineDiv = document.createElement('div');
      const spanHtml = renderHtmlSpan(line, false, false).html;
      lineDiv.appendChild(spanHtml);
      div.appendChild(lineDiv);
    }
    return div;
  }

  /**
   * Recursively render a Span to HTML, optionally rendering DropTargets as
   * well (not rendered for Snippets). If DropTargets are rendered, accumulate
   * a list of references to them during rendering.
   *
   * @param span The Span to render.
   * @param withDropTargets Whether to render drop targets.
   * @param parentExpr The parent expression. Only used for DropTargets.
   * @param parentPath The path to the parent expression. Only used for
   *                   DropTargets.
   * @param withinParentTarget Whether span is contained within a another
   *                           DropTarget span.
   * @return A new RenderHtml.
   *
   * @throws If drop targets are nested, or lack expression and path info.
   */
  function renderHtmlSpan(span: Span,
                          withDropTargets: boolean,
                          withClickHandlers: boolean,
                          parentExpr?: AST.Expression,
                          parentPath?: string[],
                          withinParentTarget = false)
  : HtmlWithDropTargets {
    const expression = span.expr || parentExpr;
    const path = span.path || parentPath;
    const html = document.createElement('span');
    let inner = html;
    const result: HtmlWithDropTargets = {html};

    let withinTarget = withinParentTarget;
    if (withDropTargets && span.dropTarget) {
      if (!expression || !path) {
        throw new Error('Cannot render drop target without Expression or path.');
      }
      if (withinParentTarget) {
        throw new Error('Cannot render nested drop target at ' + path);
      }
      const {position, id, mutateInsertionEdit} = span.dropTarget;
      html.id = id;
      html.classList.add('cw-drop-inline');
      html.classList.add('cw-drop-' + position);

      inner = document.createElement('span');
      inner.classList.add('cw-drop-inner');
      html.appendChild(inner);

      const thisTarget: DropTargetWithHtml = {
        type: DropTargetType.INLINE,
        position, path, id, html, mutateInsertionEdit
      };
      result.dropTargets = [thisTarget];
      withinTarget = true;
    }

    if (withClickHandlers && span.clickHandlerIds) {
      html.dataset['cwClick'] = span.clickHandlerIds.join(' ');
      if (span.path) {
        html.dataset['cwPath'] = span.path.join(' ');
      }
    }

    span.parts.forEach((part) => {
      if (typeof part === 'string') {
        inner.appendChild(document.createTextNode(part));
      } else if (part instanceof Span) {
        const childResult = renderHtmlSpan(
            part, withDropTargets, withClickHandlers, expression, path, withinTarget);
        inner.appendChild(childResult.html);
        if (withDropTargets && childResult.dropTargets) {
          if (!result.dropTargets) {
            result.dropTargets = [];
          }
          result.dropTargets.push(...childResult.dropTargets);
        }
      } else {
        const token = part as Token;
        const tokenHtml = document.createElement('span');
        tokenHtml.textContent = token.text;
        if (token.style) {
          tokenHtml.classList.add(token.style);
        }
        html.appendChild(tokenHtml);
      }
    });
    return result;
  }

  function renderLineDropTarget(metaline: MetaLine,
                                position: DropTargetPosition,
                                id: string)
  : DropTargetWithHtml {
    const div = document.createElement('div');
    div.id = id;
    div.classList.add('cw-drop-line');
    return {
      type: FULL_LINE,
      position, id,
      path: metaline.path,
      html: div
    };
  }
}
