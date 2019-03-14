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

/// <reference path="../ast/ast_document.ts" />
/// <reference path="../ast/expression_type.ts" />
/// <reference path="../ast/scope.ts" />
/// <reference path="../ast/value_type.ts" />
/// <reference path="../render/meta_line.ts" />
/// <reference path="./search_parser.ts" />

// TODO: Rename as CodeWords.Search.SearchContext.
namespace CodeWords.Search {
  import AstDocument = CodeWords.AST.AstDocument;
  import ExpressionType = CodeWords.AST.ExpressionType;
  import Scope = CodeWords.AST.Scope;
  import ValueType = CodeWords.AST.ValueType;
  import RenderedMetaLine = CodeWords.Render.RenderedMetaLine;
  import PendingParse = CodeWords.Search.PendingParse;


  /**
   * Function to test the candidate expression's type.
   *
   * @param type The expression type to check.
   * @return True if the expression type is valid in this context.
   */
  export type ExpressionTypeChecker = (exprType: ExpressionType) => boolean;
  export type ValueTypeChecker = (valueType: ValueType | undefined) => boolean;

  export type ContinueParseCallback =
      (context: SearchContext, inputStart: number, partResult: PendingParse) => PendingParse[];

  /**
   * A subset of the EditorState used as input for each SearchParser, and the
   * parseValuePart() function to enable parser recursion.
   */
  export interface SearchContext {
    /** @see EditorState.astDoc */
    // TODO: Make astDoc always defined. Snippets can't be inserted without a doc, so... :/
    astDoc?: AstDocument;

    /**
     * The rendered lines of the document where the search should be applied.
     * At the top level search parser, this will be the whole document, but
     * future changes are expected to limit that to just the visible lines in
     * the scrollable viewport. Delegates may see a more limited set of lines,
     * pertaining to a small or partially visible (usually indented) block.
     */
    visibleLines: RenderedMetaLine[];

    /**
     * A flattened set of variable scopes within which to search. For top level
     * SearchParses, this is the scopes pertaining to the visibleLines.
     */
    scopes: Scope[];

    /**
     * The code or descriptive text to base the search on.
     */
    searchText: string;

    // TODO: Last edit action, with edit location.

    /**
     * Some searches (particularly delegated substring searches) constrain the
     * allowed search results. If set, the isExpressionTypeAllowed function
     * will test whether exprType is valid in this context. This allows some
     * SearchParsers to fail the parse attempt early (i.e., return empty
     * PendingParse[] results).
     */
    isExpressionTypeAllowed?: ExpressionTypeChecker;

    /**
     * Some searches (particularly delegated substring searches) constrain the
     * allowed search results. If set, the isValueTypeAllowed function will
     * test whether valueType is valid in this context. This allows some
     * SearchParsers to fail the parse attempt early (i.e., return empty
     * PendingParse[] results).
     *
     * @param type The value type to check.
     * @return True if the value type is valid in this context.
     */
    isValueTypeAllowed?: ValueTypeChecker;

    /**
     * Attempt to parse a value expression from an inner segment of the search
     * text, starting at valuePartStart index. If the parse is successful,
     * continueParseCallback will be called with one resulting PendingParse
     * objects. continueParseCallback may be called multiple times, once for
     * each successful completion.
     *
     * @param optSubcontext Optional constraints on the resulting subparse.
     * @param substringStart The index of the character of searchText to begin
     *                       the subparse.
     * @param continueParseCallback The callback to call when the delegate
     *                              parser has successfully matched a substring.
     * @return The PendingParses from the subparse. May include any mix of
     *         incomplete subparses, completed subparses, and continued parses.
     *         Should be returned by the calling attemptParse(..).
     */
    // TODO: Add devName for debugging purposes.
    delegateSubParse(optSubcontext: DelegationSubcontext | undefined,
                     substringStart: number,
                     continueParseCallback: ContinueParseCallback): PendingParse[];
  }

  /**
   * The constraint properties of a SearchContext, that can be applied on top
   * of a new SearchContext before being sent to a delegated SearchParser.
   */
  export interface DelegationSubcontext {
    /**
     * Optionally override the lines of the document relevant for the search.
     *
     * For instance, a search may be constrained to the visible section of a
     * function definition, with locally defined variables that are strong
     * search result candidates.
     *
     * @see SearchContext.visibleLines
     */
    visibleLines?: RenderedMetaLine[];

    /**
     * Optionally override the variable scopes to search.
     *
     * For instance, the dot operator may use a namespace, instance, or class
     * scope to search for members.
     *
     * @see SearchContext.scopes
     */
    scopes?: Scope[];

    /**
     * Optional function to check whether a specific ExpressionType result is
     * allowed.
     *
     * @see SearchContext.isExpressionTypeAllowed
     */
    isExpressionTypeAllowed?: ExpressionTypeChecker;

    /**
     * Optional function to check whether a specific ValueType result is
     * allowed.
     *
     * @see SearchContext.isValueTypeAllowed
     */
    isValueTypeAllowed?: ValueTypeChecker;
  }
}
