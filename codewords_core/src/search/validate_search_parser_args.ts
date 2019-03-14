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
  /**
   * Flag to enable or disable SearchContext validation.
   * @type {boolean}
   */
  export const ENABLE_VALIDATE_SEARCH_PARSER_ARGS = true;

  /**
   * Validates the inputs to SearchParser.attemptParse when
   * ENABLE_VALIDATE_SEARCH_PARSER_ARGS is true. Specifically,
   * it checks the prev is a proper subset of the current input.
   * @param context
   * @param parseStart
   * @param prev
   * @return True if the prev PendingParse was found, was checked and is valid.
   *         Otherwise false or throws.
   * @throws If ENABLE_VALIDATE_SEARCH_PARSER_ARGS and arguments were invalid or inconsistent.
   */
  export function validateSearchParserArgs(parser: SearchParser,
                                           context: SearchContext,
                                           parseStart: number,
                                           prev: PendingParse | undefined): boolean {
    if (!prev || !ENABLE_VALIDATE_SEARCH_PARSER_ARGS) {
      return false;
    }
    if (prev.inputStart !== parseStart) {
      throw new Error('prev.inputStart !== parseStart');
    }
    const prevInput = prev.input.slice(prev.inputStart, prev.inputEnd);
    const sharedInput = context.searchText.slice(parseStart, prev.inputEnd);
    if (prevInput !== sharedInput) {
      throw new Error('prev input does not match.');
    }
    return true;
  }
}
