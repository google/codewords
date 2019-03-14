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
/// <reference path="../javascript_code.ts" />
/// <reference path="../snippet/string_value_snippet.ts" />

namespace CodeWordsJS.Search {
  import SearchContext = CodeWords.Search.SearchContext;
  import PendingParse = CodeWords.Search.PendingParse;
  import SearchParser = CodeWords.Search.SearchParser;
  import StringValueSnippet = CodeWordsJS.Snippet.StringValueSnippet;

  export const QUOTED_STRING_LITERAL_SCORE = 1000;
  export const QUOTED_STRING_INCOMPLETE_SCORE = 500;
  export const UNQUOTED_SCORE = 20;

  const IS_WHITESPACE = /\s/;

  // TODO: Option allowUnquotedStrings
  // TODO: Option preferred quote character

  export enum StringLiteralParseState {
    /** Attempt to parse failed. No additional input will make it valid. */
    NO_MATCH = -1,

    /** Has not attempted to match any characters yet. */
    INITIAL_EMPTY_STRING = 0,

    /**
     * A string does not need further processing. Either a quoted string that
     * has matched with its end quote character, or an unquoted string that
     * has terminated with whitespace.
     */
    COMPLETE_STRING = 1,

    /** A quoted or unquoted string could be completed. It is not pending escaped characters. */
    PENDING_COMPLETION = 2,

    /** A character sequence with an incomplete character escape. */
    PARTIAL_ESCAPE = 3,

    /** An unquoted string that may be continued with a non-alpha, non-quote character. */
    UNQUOTED_TRAILING_WHITESPACE = 4

    // TODO: PARTIAL_UNICODE_ESCAPE
  }

  export interface StringLiteralPendingParse extends PendingParse {
    state: StringLiteralParseState;
    quoteChar: string;
    value: string;
    escapedValue: string;
    pendingEscapeCode?: string;
  }

  export class StringLiteralParser implements SearchParser {
    constructor() {}

    toString() {
      return 'StringLiteralParser';
    }

    attemptParse(context: SearchContext,
                 parseStart: number,
                 prev: PendingParse | undefined): StringLiteralPendingParse[] {
      if (context.isValueTypeAllowed) {
        if (!context.isValueTypeAllowed(TYPE_STRING)) {
          return [];
        }
      }
      if (context.isExpressionTypeAllowed) {
        if (!context.isExpressionTypeAllowed(STRING_LITERAL)) {
          return [];
        }
      }

      const prevStringParse = prev as StringLiteralPendingParse;
      if (CodeWords.Search.validateSearchParserArgs(this, context, parseStart, prev) &&
          prevStringParse.state === undefined) {
        throw new Error('Missing StringLiteralPendingParse.state');
      }

      if (prev && prevStringParse.state === StringLiteralParseState.COMPLETE_STRING) {
        return [prevStringParse];  // Nothing to do
      }

      const lang = context.astDoc!.language;
      const input = context.searchText;
      const inputStart = parseStart;
      const length = input.length;
      let n = prev ? prev.inputEnd - prev.inputStart : 0;

      let state: StringLiteralParseState =
          prev ? prevStringParse.state : StringLiteralParseState.INITIAL_EMPTY_STRING;
      let quoteChar = prev ? prevStringParse.quoteChar : '';
      let value = prev ? prevStringParse.value : '';
      let escapedValue = prev ? prevStringParse.escapedValue : '';
      let pendingEscapeCode = prev ? prevStringParse.pendingEscapeCode : undefined;

      const pendingParseResults: StringLiteralPendingParse[] = [];

      // Validation and prep for additional characters.
      if (state === StringLiteralParseState.PARTIAL_ESCAPE) {
        if (!pendingEscapeCode) {
          throw new Error('PARTIAL_ESCAPE missing escapeCode');
        }
        // Remove the escape code and the temporary extra backslash before appending more.
        const lastBackslash = value.lastIndexOf('\'');
        if (lastBackslash === -1) {
          throw new Error('Missing backslash in value of PARTIAL_ESCAPE');
        }
        value = value.slice(0, lastBackslash);
      }

      // Parse the input character-by-character, tracking state with the
      // above variables.
      CHAR_LOOP: for (; n < length; ++n) {
        const char = input[inputStart + n];  // TODO: Test codepoints instead of strings.
        switch (state) {
          case StringLiteralParseState.COMPLETE_STRING:
            break CHAR_LOOP;

          case StringLiteralParseState.INITIAL_EMPTY_STRING:
            if(IS_WHITESPACE.test(char)) {
              // Cannot start an unquoted string with whitespace.
              state = StringLiteralParseState.NO_MATCH;
              break CHAR_LOOP;
            } else if (char === '\'' || char === '"') {
              quoteChar = char;
              state = StringLiteralParseState.PENDING_COMPLETION;
            } else if (char === '\\') {
              state = StringLiteralParseState.PARTIAL_ESCAPE;
              pendingEscapeCode = char;
            } else {
              state = StringLiteralParseState.PENDING_COMPLETION;
              value = char;
              escapedValue = getEscapeCode(char, quoteChar);
            }
            break;

          case StringLiteralParseState.PENDING_COMPLETION:
            if (char === quoteChar) {
              state = StringLiteralParseState.COMPLETE_STRING;
              break;
            } else if (char === '\\') {
              state = StringLiteralParseState.PARTIAL_ESCAPE;
              value += '\\';
              pendingEscapeCode = char;
            } else if(IS_WHITESPACE.test(char)) {
              if (quoteChar === '') {
                // Save the results of the unquoted string at the end of each word.
                const quotedAndEscaped = getQuotedAndEscaped(quoteChar, escapedValue);
                const score = quoteChar === '' ? UNQUOTED_SCORE : QUOTED_STRING_INCOMPLETE_SCORE;
                const expr =
                    new StringLiteralExpression(lang, STRING_LITERAL, {value, quotedAndEscaped});
                pendingParseResults.push({
                  parser: this, state: StringLiteralParseState.COMPLETE_STRING,
                  input, inputStart, inputEnd: n,
                  value, score, mayContinue: false,
                  quoteChar, escapedValue,
                  getExpression: () => expr,
                  getSnippet: () => new StringValueSnippet(expr, score)
                });
                state = StringLiteralParseState.UNQUOTED_TRAILING_WHITESPACE;
              }
              value += char;
              escapedValue += getEscapeCode(char, quoteChar);
            } else {
              state = StringLiteralParseState.PENDING_COMPLETION;
              value += char;
              escapedValue += getEscapeCode(char, quoteChar);
            }
            break;

          case StringLiteralParseState.UNQUOTED_TRAILING_WHITESPACE:
            if (char === '\\') {
              state = StringLiteralParseState.PARTIAL_ESCAPE;
              pendingEscapeCode = char;
            } else {
              value += char;
              escapedValue += getEscapeCode(char, quoteChar);
              if (!IS_WHITESPACE.test(char)) {
                state = StringLiteralParseState.PENDING_COMPLETION;
              }
            }
            break;

          default:
            throw new Error('Unhandled state: ' + state);
        }
      }

      const inputEnd = inputStart + n;
      switch (state) {
        case StringLiteralParseState.NO_MATCH:
          // No match
          return [];
        case StringLiteralParseState.COMPLETE_STRING: {
          const score = QUOTED_STRING_LITERAL_SCORE;
          const quotedAndEscaped = quoteChar + escapedValue + quoteChar;
          const expr = new StringLiteralExpression(lang, STRING_LITERAL, {
            value, quotedAndEscaped
          });
          pendingParseResults.push({
            parser: this, state,
            input, inputStart, inputEnd,
            value, score, mayContinue: false,
            quoteChar, escapedValue,
            getExpression: () => expr,
            getSnippet: () => new StringValueSnippet(expr, score)
          });
          return pendingParseResults;
        }

        case StringLiteralParseState.PENDING_COMPLETION: {
          const score = quoteChar === '' ? UNQUOTED_SCORE : QUOTED_STRING_INCOMPLETE_SCORE;
          const quotedAndEscaped = getQuotedAndEscaped(quoteChar, escapedValue);
          const expr = new StringLiteralExpression(lang, STRING_LITERAL, {
            value, quotedAndEscaped
          });
          pendingParseResults.push({
            parser: this, state,
            input, inputStart, inputEnd,
            value, score, mayContinue: true,
            quoteChar, escapedValue,
            getExpression: () => expr,
            getSnippet: () => new StringValueSnippet(expr, score)
          });
          return pendingParseResults;
        }

        case StringLiteralParseState.UNQUOTED_TRAILING_WHITESPACE: {
          // Push a version that might continue, but doesn't resolve.
          // Resolution should be covered by the previous PendingParse.
          pendingParseResults.push({
            parser: this, state,
            input, inputStart, inputEnd,
            value, score: -1, mayContinue: true,
            quoteChar, escapedValue,
            getExpression: () => undefined,
            getSnippet: () => undefined
          });
          return pendingParseResults;
        }

        default:
          throw new Error('Unhandled state: ' + state);
      }
    }
  }

  function getQuotedAndEscaped(quoteChar: string, escapedValue: string) {
    const actualQuote = (quoteChar === '') ? '\'' : quoteChar;
    return actualQuote + escapedValue + actualQuote;
  }

  function getEscapeCode(char: string, quote: string): string {
    switch(char) {
      case '\0':  // NULL character
        return '\\0';
      case '\\':
        return '\\\\';
      case '\'':
        return quote !== '\"' ? '\\\'' : char;  // Default to escaped, in case quote is undefined.
      case '\"':
        return quote === '\"' ? '\\\"' : char;
      case '\b':  // backspace
        return '\\b';
      case '\f':  // form feed
        return '\\f';
      case '\n':  // newline
        return '\\n';
      case '\r':  // carriage return
        return '\\r';
      case '\t':  // tab
        return '\\t';
      case '\v':  // vertical tab
        return '\\v';
      default:
        return char;
    }
  }
}