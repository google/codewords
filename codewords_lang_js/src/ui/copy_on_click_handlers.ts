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
/// <reference path="../expression/number_literal_expression.ts" />
/// <reference path="../expression/string_literal_expression.ts" />
/// <reference path="../expression/js_expression_types.ts" />
/// <reference path="../snippet/expression_snippet.ts" />
/// <reference path="../snippet/number_value_snippet.ts" />
/// <reference path="../snippet/string_value_snippet.ts" />

namespace CodeWordsJS.UI {
  import setSnippetPaletteContents = CodeWords.Action.setSnippetPaletteContents;
  import Expression = CodeWords.AST.Expression;
  import ExpressionClick = CodeWords.UI.ExpressionClick;
  import ExpressionClickHandlers = CodeWords.UI.ExpressionClickHandlers;

  import NumberLiteralExpression = CodeWordsJS.NumberLiteralExpression;
  import StringLiteralExpression = CodeWordsJS.StringLiteralExpression;
  import ExpressionSnippet = CodeWordsJS.Snippet.ExpressionSnippet;
  import NumberValueSnippet = CodeWordsJS.Snippet.NumberValueSnippet;
  import StringValueSnippet = CodeWordsJS.Snippet.StringValueSnippet;

  import NUMBER_LITERAL = CodeWordsJS.NUMBER_LITERAL;
  import STRING_LITERAL = CodeWordsJS.STRING_LITERAL;

  export const ONCLICK_COPY_TO_SNIPPETS = 'copy_snippet';

  function getExpression(exprClick: ExpressionClick): Expression {
    const {editor, path} = exprClick;
    if (!path) {
      throw new Error('No path to expression.');
    }

    const astDoc = editor.getCurrentState().astDoc;
    if (!astDoc) {
      throw new Error('No AstDocument.');
    }

    const expr = astDoc.getDescendant(path);
    if (!expr) {
      console.error('onClickCopyLiteralToSearch: Expression not found: ', path);
      throw new Error('Expression not found: ' + path);
    }
    return expr;
  }

  export function onClickCopyToSearch(exprClick: ExpressionClick): boolean {
    const {editor, html} = exprClick;
    const expr = getExpression(exprClick);

    let searchText, snippets;
    if (expr.type === NUMBER_LITERAL) {
      const numExpr = expr as NumberLiteralExpression;
      snippets = [new NumberValueSnippet(numExpr)];
      searchText = numExpr.codeString;
    } else if (expr.type === STRING_LITERAL) {
      const strExpr = expr as StringLiteralExpression;
      snippets = [new StringValueSnippet(strExpr)];
      searchText = strExpr.quotedAndEscaped;

    // TODO: If FUNCTION_CALL or CONSTRUCTOR, copy without args, and provide autocompleted snippets.
    } else {
      searchText = html.innerText;
      snippets = [new ExpressionSnippet(expr, 1000)];
    }

    editor.scheduleAction(setSnippetPaletteContents(searchText, snippets));
    return true;
  }

  export const COPY_ON_CLICK_HANDLERS: ExpressionClickHandlers = (() => {
    const map = Object.create(null);
    map[ONCLICK_COPY_TO_SNIPPETS] = onClickCopyToSearch;
    return Object.freeze(map);
  })();
}
