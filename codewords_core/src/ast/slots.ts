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

/// <reference path="expression.ts" />

namespace CodeWords.AST {
  /** Container interface for named slot values. */
  export interface SlotChildren {
    [key: string]: Expression;
  }

  /**
   * Currently allowed pattern for slot names for ObjectBasedExpressions. Any
   * order of digits, english letters, and the underscore.
   *
   * This requirement will relax in the future.
   */
  export const SLOT_NAME_REGEX = /^[0-9A-Z_]+$/i;

  /**
   * Tests whether the string is a valid slot name.
   *
   * @param slotName The proposed name.
   * @return True if the slot name is value. Otherwise false.
   */
  export function isSlotNameValid(slotName: string): boolean {
    if (typeof name !== 'string') {
      throw new Error('Slot names must be primitive slot names.');
    }
    // Use the publicly exported reference to SLOT_NAME_REGEX.
    return !!slotName.match(CodeWords.AST.SLOT_NAME_REGEX);
  }

  /**
   * Validates whether a list of slot names are non-null and valid.
   * @param names A list of proposed slot names.
   */
  export function validateSlotNames(names: string[] | ReadonlyArray<string>) {
    for (const name of names) {
      // Use the publicly exported reference to isSlotNameValid().
      if (!CodeWords.AST.isSlotNameValid(name)) {
        throw new Error(`Invalid slot name: "${name}"`);
      }
    }
  }

  /**
   * Check the slot value is a Expression of the expected language. Null and
   * undefined values are valid, representing unfilled slots.
   *
   * @param expr The expression to check.
   * @param expectedLang The expected CodeLanguage.
   * @throws If any slots key is not a SlotId or values that are not expressions.
   */
  export function validateSlotValue(expr: Expression, expectedLang: CodeLanguage) {
    if (expr) {
      if (!(expr instanceof Expression)) {
        throw new Error('');
      }

      if (expr.language !== expectedLang) {
        throw new Error(
            `Mismatched CodeLanguage. Expected ${expectedLang}. Found: ${expr.language}`);
      }
    }
  }

  /**
   * Check each slot value is a Expression of the expected language. Null and
   * undefined values are valid, representing unfilled slots.
   *
   * @param exprs The expressions to check.
   * @param expectedLang The expected CodeLanguage.
   * @throws If any slots key is not a SlotId or values that are not expressions.
   */
  export function validateSlotValues(exprs: Expression[], expectedLang: CodeLanguage) {
    for(const expr of exprs) {
      CodeWords.AST.validateSlotValue(expr, expectedLang);
    }
  }
}
