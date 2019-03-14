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

namespace CodeWords.Search {
  import Expression = CodeWords.AST.Expression;
  import Snippet = CodeWords.Snippet.Snippet;
  import SearchContext = CodeWords.Search.SearchContext;

  export interface SearchParser {
    /**
     * Attempts to parse the searchText of SnippetContext, beginning at
     * parseStart. The attempt may be a continuation of a prior parse attempt
     * passed in as prev. If so, prev must have some same initial subset of
     * characters at its own start index.
     *
     * If the resulting PendingParse has mayContinue set true, the parse may be
     * used to initialize a future parses with more characters appended to the
     * end of the input. The pending parse may carry whatever additional data
     * necessary to assist in continuing the match. The PendingParse will only
     * ever be passed into the SearchParser that created it.
     *
     * attemptParse(..) results is should always be deterministic for any given
     * input parameters.
     *
     * attemptParse(..) must give the same results with or without the previous
     * PendingParse. The previous parse is only intended to reduce repeated
     * parsing as the user types (appends) more search text.
     *
     * @param context The context of the snippet search, including the
     *                searchText.
     * @param parseStart The index of the start character of context.searchText.
     * @param prev A previous PendingParse, if available.
     * @return {CodeWords.Search.PendingParse[] | null}
     */
    attemptParse(context: SearchContext,
                 parseStart: number,
                 prev: PendingParse | undefined): PendingParse[];
  }

  // TODO: Move to its own file.
  export interface PendingParse {
    /** The parser that created this parse. */
    parser: SearchParser;

    /** The input string for this parse. */
    input: string;

    /** The index of the first character for this parse. */
    inputStart: number;

    /** The index after the last character matched in this parse. */
    inputEnd: number;

    /**
     * A number indicating the strength of the parse or match. Higher values
     * indicate more complete or more certain matches.
     */
    score: number;

    /** Whether this parse might continue with additional characters. */
    mayContinue: boolean;

    /**
     * The expression for the value presented by this parse, if any.
     * Required when the parse represents a values for a parent parse.
     */
    getExpression(): Expression | undefined;

    /**
     * A snippet representing this parse, if any. Required for any complete
     * parse of the search input.
     */
    getSnippet(): Snippet | undefined;
  }
}
