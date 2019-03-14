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

/// <reference path="../../codewords_core/build/codewords_core.d.ts" />
/// <reference path="./ui/copy_on_click_handlers.ts" />


namespace CodeWordsJS {
  import DynamicSlotsExpression = CodeWords.AST.DynamicSlotsExpression;
  import Expression = CodeWords.AST.Expression;
  import FixedSlotsExpression = CodeWords.AST.FixedSlotsExpression;
  import dropTarget = CodeWords.Render.dropTarget;
  import Span = CodeWords.Render.Span;
  import token = CodeWords.Render.token;

  import AFTER = CodeWords.Render.DropTargetPosition.AFTER;
  import BEFORE = CodeWords.Render.DropTargetPosition.BEFORE;
  import REPLACE = CodeWords.Render.DropTargetPosition.REPLACE;

  import FULL_LINE = CodeWords.Render.DropTargetType.FULL_LINE;
  import INLINE = CodeWords.Render.DropTargetType.INLINE;

  import ONCLICK_COPY_TO_SNIPPETS = CodeWordsJS.UI.ONCLICK_COPY_TO_SNIPPETS;

  /** Token style names. */
  enum Style {
    IDENTIFIER = 'js_identifier',
    KEYWORD = 'js_keyword',
    NUMBER_LITERAL = 'js_number',
    PUNCTUATION = 'js_punctuation',
    STRING_LITERAL = 'js_string'
  }

  /** Construct a Span for the provided JavaScript Expression. */
  export function buildSpan(expr: Expression,
                            path: string[])
  : Span {
    const typeName = expr.type.name;
    switch (typeName) {
      case FUNCTION_CALL.name:
        return buildFunctionCallSpan(expr as FixedSlotsExpression, path);

      case IDENTIFIER.name:
        return buildIdentifierSpan(expr as IdentifierExpression, path);

      case NEW.name:
        return buildNewObjectSpan(expr as FixedSlotsExpression, path);

      case NUMBER_LITERAL.name:
        return buildNumberLiteralSpan(expr as NumberLiteralExpression, path);

      case OP_ASSIGNMENT.name:
        return buildAssignmentOperatorSpan(expr as FixedSlotsExpression, path);

      case OP_MEMBER_REF.name:
        return buildMemberOfOperatorSpan(expr as FixedSlotsExpression, path);

      case STRING_LITERAL.name:
        return buildStringLiteralSpan(expr as StringLiteralExpression, path);

      default:
        throw new Error(`UNIMPLEMENTED: buildLineRenderSpec() for ${typeName}.`);
    }
  }

  function buildSpanForChild(expr: Expression, parentPath: string[], childSlotName: string) {
    const childPath = [...parentPath, childSlotName];
    const child = expr.getChild(childSlotName);
    if (!child) {
      throw new Error('Child not found at ' + childPath);
    }
    return buildSpan(child, childPath);
  }

  /** Append the CALL_PARAMETERS, or empty parenthesis, to an existing span. */
  function appendCallParameters(expr: Expression | undefined,
                                span: Span,
                                path: string[]) {
    span.append(token('(', Style.PUNCTUATION));
    if (expr) {
      const dynExpr = expr as DynamicSlotsExpression;
      const slotNames = dynExpr.getSlotNames();
      // TODO: Alignment hint for line break
      slotNames.forEach((slot, i) => {
        if (i > 0) {
          // TODO: LineBreakHint
          span.append(token(', ', Style.PUNCTUATION));
        }
        const child = dynExpr.getChild(slot)!;
        span.append(buildSpan(child, [...path, slot]));
      });
    }
    span.append(token(')', Style.PUNCTUATION));
  }

  /** Construct a span for the '=' operator, a OP_ASSIGNMENT expression. */
  function buildAssignmentOperatorSpan(expr: FixedSlotsExpression,
                                       path: string[])
  : Span {
    const span = new Span(expr, path);
    span.append(buildSpanForChild(expr, path, 'left'));
    span.append(' ', token('=', Style.PUNCTUATION), ' ');
    span.append(buildSpanForChild(expr, path, 'right'));
    return span;
  }

  /** Construct a span for a FUNCTION_CALL expression. */
  function buildFunctionCallSpan(fnCall: FixedSlotsExpression,
                                 path: string[])
  : Span {
    const span = new Span(fnCall, path, [ONCLICK_COPY_TO_SNIPPETS]);
    span.append(buildSpanForChild(fnCall, path, 'callable'));
    appendCallParameters(fnCall.getChild('params'), span, [...path, 'params']);
    return span;
  }

  /** Construct a span for a IDENTIFIER expression. */
  function buildIdentifierSpan(identifier: IdentifierExpression,
                               path: string[])
  : Span {
    const span = new Span(identifier, path);
    span.append(token(identifier.name, Style.IDENTIFIER));
    return span;
  }

  /** Construct a span for the dot operator, a OP_MEMBER_REF expression. */
  function buildMemberOfOperatorSpan(expr: FixedSlotsExpression,
                                     path: string[])
  : Span {
    const span = new Span(expr, path);
    span.append(buildSpanForChild(expr, path, 'parent'));
    span.append(token('.', Style.PUNCTUATION));
    span.append(buildSpanForChild(expr, path, 'child'));
    return span;
  }

  /** Construct a span for the 'new' operator, a NEW expression. */
  function buildNewObjectSpan(newExpr: FixedSlotsExpression,
                              path: string[])
  : Span {
    const span = new Span(newExpr, path, [ONCLICK_COPY_TO_SNIPPETS]);
    span.append(token('new', Style.KEYWORD), ' ');
    span.append(buildSpanForChild(newExpr, path, 'class'));
    appendCallParameters(newExpr.getChild('params'), span, [...path, 'params']);
    return span;
  }

  /** Construct a span for a STRING_NUMBER expression. */
  function buildNumberLiteralSpan(numberLiteral: NumberLiteralExpression,
                                  path: string[])
  : Span {
    const span = new Span(numberLiteral, path, [ONCLICK_COPY_TO_SNIPPETS]);

    // Prepend: increment, decrement, negate, binary operator, etc.
    span.append(dropTarget(INLINE, BEFORE));

    // Replace: another number, wrap with function
    const replaceable = dropTarget(INLINE, REPLACE);
    replaceable.append(token(numberLiteral.codeString, Style.NUMBER_LITERAL));
    span.append(replaceable);

    // Postpend: binary operator, etc.
    span.append(dropTarget(INLINE, AFTER));
    return span;
  }

  /** Construct a span for a STRING_LITERAL expression. */
  function buildStringLiteralSpan(stringLiteral: StringLiteralExpression,
                                  path: string[])
  : Span {
    const span = new Span(stringLiteral, path, [ONCLICK_COPY_TO_SNIPPETS]);

    // Prepend: pre-concatenate '+'
    span.append(dropTarget(INLINE, BEFORE));

    // Replace: another string, wrap with function
    const replaceable = dropTarget(INLINE, REPLACE);
    replaceable.append(token(stringLiteral.quotedAndEscaped, Style.STRING_LITERAL));
    span.append(replaceable);

    // Postpend: concatenate '+'
    span.append(dropTarget(INLINE, AFTER));
    return span;
  }
}
