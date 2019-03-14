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
/// <reference path="../snippet/number_value_snippet.ts" />

namespace CodeWordsJS.Search {
  import SearchContext = CodeWords.Search.SearchContext;
  import PendingParse = CodeWords.Search.PendingParse;
  import SearchParser = CodeWords.Search.SearchParser;

  import NumberValueSnippet = CodeWordsJS.Snippet.NumberValueSnippet;

  export const DEFAULT_NUMBER_LITERAL_SCORE = 1000;

  export interface NumberLiteralParserOptions {
    allowInfinity?: boolean;
    allowNaN?: boolean;
    // TODO: allowExponents
    // TODO: allowHex
    // TODO: allowOctal
    // TODO: allowBinary
  }

  export enum NumberLiteralParseState {
    NO_MATCH = -1,
    INITIAL_EMPTY_STRING = 0,
    INITIAL_DECIMAL_POINT = 1,
    INITIAL_SIGN = 2,
    INITIAL_ZERO = 3,  // Separate for octal and binary support.
    INFINITY = 4,
    NAN = 5,
    INTEGER = 6,
    FLOAT = 7
  }

  const IS_DECIMAL = /\d/;
  const IS_ALPHANUMERIC = /\w/;

  export interface NumberLiteralPendingParse extends PendingParse {
    state: NumberLiteralParseState;
    sign: string;
  }

  export class NumberLiteralParser implements SearchParser {
    readonly allowNaN_: boolean;
    readonly allowInfinity_: boolean;

    constructor(options: NumberLiteralParserOptions = {}) {
      this.allowInfinity_ = options.allowInfinity === undefined ? true : options.allowInfinity;
      this.allowNaN_ = options.allowNaN === undefined ? true : options.allowNaN;
    }

    toString() {
      return 'NumberLiteralParser';
    }

    attemptParse(context: SearchContext,
                 parseStart: number,
                 prev: PendingParse | undefined): NumberLiteralPendingParse[] {
      if (context.isValueTypeAllowed) {
        if (!context.isValueTypeAllowed(TYPE_NUMBER)) {
          return [];
        }
      }
      if (context.isExpressionTypeAllowed) {
        if (!context.isExpressionTypeAllowed(NUMBER_LITERAL)) {
          return [];
        }
      }

      const prevNumberParse = prev as NumberLiteralPendingParse;
      if (CodeWords.Search.validateSearchParserArgs(this, context, parseStart, prev) &&
          prevNumberParse.state === undefined) {
        throw new Error('Missing NumberLiteralPendingParse.state');
      }

      const lang = context.astDoc!.language;
      const input = context.searchText;
      const inputStart = parseStart;
      const length = input.length;
      let n = prev ? prev.inputEnd - prev.inputStart : 0;

      let state = prev ? prevNumberParse.state : NumberLiteralParseState.INITIAL_EMPTY_STRING;
      let sign = prev ? prevNumberParse.sign : '';

      CHAR_LOOP: for(; n < length; ++n) {
        const char = input[inputStart + n];  // TODO: Test codepoints instead of strings.
        switch (state) {
          case NumberLiteralParseState.NO_MATCH:
            break CHAR_LOOP;

          case NumberLiteralParseState.INITIAL_EMPTY_STRING:
            if (char === '-' || char === '+') {
              state = NumberLiteralParseState.INITIAL_SIGN;
              sign = char;
            } else if (char === '0') {
              state = NumberLiteralParseState.INITIAL_ZERO;
            } else if (char === '.') {
              state = NumberLiteralParseState.INITIAL_DECIMAL_POINT;
            } else if (IS_DECIMAL.test(char)) {
              state = NumberLiteralParseState.INTEGER;
            } else if (this.allowInfinity_ && (char === 'i' || char === 'I')) {
              state = NumberLiteralParseState.INFINITY;
            } else if (this.allowNaN_ && (char === 'n' || char === 'N')) {
              state = NumberLiteralParseState.NAN;
            } else {
              state = NumberLiteralParseState.NO_MATCH;
              break CHAR_LOOP;
            }
            break;

          case NumberLiteralParseState.INITIAL_SIGN:
            if (char === '.') {
              state = NumberLiteralParseState.INITIAL_DECIMAL_POINT;
            } else if (IS_DECIMAL.test(char)) {
              state = NumberLiteralParseState.INTEGER;
            } else if (this.allowInfinity_ && (char === 'i' || char === 'I')) {
              state = NumberLiteralParseState.INFINITY;
            } else {
              state = NumberLiteralParseState.NO_MATCH;
              break CHAR_LOOP;
            }
            break;

          case NumberLiteralParseState.INITIAL_ZERO:
            // TODO: 0x for hex, Oo for octal, 0b for binary
          case NumberLiteralParseState.INTEGER:
            if (char === '.') {
              state = NumberLiteralParseState.FLOAT;
            } else if (IS_DECIMAL.test(char)) {
              state = NumberLiteralParseState.INTEGER;
            } else {
              break CHAR_LOOP;  // Accept INTEGER
            }
            break;

          case NumberLiteralParseState.INITIAL_DECIMAL_POINT:
            if (IS_DECIMAL.test(char)) {
              state = NumberLiteralParseState.FLOAT;
            } else {
              state = NumberLiteralParseState.NO_MATCH;
              break CHAR_LOOP;
            }
            break;

          case NumberLiteralParseState.FLOAT:
            if (IS_DECIMAL.test(char)) {
              // Still FLOAT
            } else {
              // TODO: E for Exponent
              break CHAR_LOOP;  // Accept FLOAT
            }
            break;

          case NumberLiteralParseState.INFINITY: {
            const target = sign + 'infinity';
            if (n < target.length && char.toLowerCase() === target[n]) {
              // Allow INFINITY and continue
            } else if (IS_ALPHANUMERIC.test(char)) {
              state = NumberLiteralParseState.NO_MATCH;
            } else {
              // Allow INFINITY terminated by whitespace, operator, etc.
              // Possibly partial match.
              break CHAR_LOOP;
            }
            break;
          }

          case NumberLiteralParseState.NAN: {
            const target = 'nan';
            if (n < target.length && char.toLowerCase() === target[n]) {
              // Allow NAN and continue
            } else if (IS_ALPHANUMERIC.test(char)) {
              state = NumberLiteralParseState.NO_MATCH;
            } else {
              // Allow NAN terminated by whitespace, operator, etc.
              // Possibly partial match.
              break CHAR_LOOP;
            }
            break;
          }

          default:
            throw new Error('Unhandled state: ' + state);
        }
      }

      const inputEnd = inputStart + n;
      switch (state) {
        case NumberLiteralParseState.NO_MATCH:
          // No match
          return [];
        case NumberLiteralParseState.INITIAL_EMPTY_STRING:
        case NumberLiteralParseState.INITIAL_DECIMAL_POINT:
        case NumberLiteralParseState.INITIAL_SIGN:
          // Incomplete match. No expression or snippet.
          return [{
            parser: this,
            input, inputStart, inputEnd,
            state, sign, score: 0, mayContinue: true,
            getExpression: () => undefined,
            getSnippet: () => undefined
          }];
        case NumberLiteralParseState.INITIAL_ZERO:
        case NumberLiteralParseState.INTEGER:
        case NumberLiteralParseState.FLOAT: {
          // Match value
          const codeString = input.slice(inputStart, inputEnd);
          const value = Number(codeString);
          const score = DEFAULT_NUMBER_LITERAL_SCORE;
          const expr = NUMBER_LITERAL.newExpression(lang, {value, codeString});
          return [{
            parser: this,
            input, inputStart, inputEnd,
            state, sign, score, mayContinue: true,
            getExpression: () => expr,
            getSnippet: () => new NumberValueSnippet(expr, score)
          }];
        }
        case NumberLiteralParseState.INFINITY: {
          // Match value
          const codeString = sign + 'Infinity';
          const value = Number(codeString);
          // Linear interpolate score from 1 (first 'i') to DEFAULT_NUMBER_LITERAL_SCORE.
          const matchLen = n - sign.length;
          const score =
              ((DEFAULT_NUMBER_LITERAL_SCORE - 1) * ((matchLen - 1) / (codeString.length - 1))) + 1;
          const expr = NUMBER_LITERAL.newExpression(lang, {value, codeString});
          return [{
            parser: this,
            input, inputStart, inputEnd,
            state, sign, score, mayContinue: input.length < codeString.length,
            getExpression: () => expr,
            getSnippet: () => new NumberValueSnippet(expr, score)
          }];
        }

        case NumberLiteralParseState.NAN: {
          const codeString = 'NaN';
          const value = NaN;
          // Only match NaN if it is fully specified.
          const matched = (n === 3);
          const score = matched ? DEFAULT_NUMBER_LITERAL_SCORE : 0;
          const expr = NUMBER_LITERAL.newExpression(lang, {value, codeString});
          return [{
            parser: this,
            input, inputStart, inputEnd,
            state, sign, score, mayContinue: n < 3,
            getExpression: () => matched ? expr : undefined,
            getSnippet: () => matched ? new NumberValueSnippet(expr, score) : undefined
          }];
        }

        default:
          throw new Error('Unhandled state: ' + state);
      }
    }
  }
}
