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

namespace CodeWordsJS.Value {
  import Scope = CodeWords.AST.Scope;

  export type MemberMap = {[key: string]: ScopeMember};
  export type ReservedWordMap = {[key: string]: boolean};

  // TODO: Expand this. Should include unicode escapes and most of unicode.
  export const IDENTIFIER_START_CHAR = /[_$A-Za-z]/;
  export const IS_IDENTIFIER_NAME = /[_$a-zA-Z][_$a-zA-Z0-9]*/;

  // Pragmatic list of reserved words, includes future reserved words and globals that act like
  // reserved words. See https://mathiasbynens.be/notes/javascript-identifiers
  const ES5_RESERVED_WORDS = [
    'arguments', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'enum', 'eval', 'export', 'extends', 'finally', 'for', 'function', 'if',
    'implements', 'import', 'Infinity', 'instanceof', 'interface', 'let', 'NaN', 'new', 'package',
    'private', 'protected', 'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'try',
    'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield'
  ].reduce((map, reservedWord: string) => {
    map[reservedWord] = true;
    return map;
  }, {} as ReservedWordMap);

  const ES6_RESERVED_WORDS = [
    'await'
  ].reduce((map, reservedWord: string) => {
    map[reservedWord] = true;
    return map;
  }, {...ES5_RESERVED_WORDS});

  export interface ScopeMember {
    scope: JsScope;
    key: string | number;
    name: string;  // Numeric names have to be converted to strings
    isIdentifier: boolean;
    isNumber: boolean;
    valueType: JsValueType;

    // TODO: Autocomplete/popularity scoring modifier (here or somewhere similar).
  }

  /**
   * A scope of identified value. Members are treated abstractly as just value
   * types, because that is what is important to the autocompletion system.
   */
  export class JsScope implements Scope {
    private allMembers_: MemberMap = Object.create(null);

    // TODO: Sort this for improved lookup
    private identifiers_: ScopeMember[] = [];  // For search completion

    // TODO: Pass in reserved words to support different versions of JavaScript.
    constructor(/** parent The parent scope, if any. */
                readonly parent: JsScope | undefined = undefined) {
    }

    /**
     * @return True if this scope does not have any members, including parent
     *         scope members. Otherwise false.
     */
    isEmpty(): boolean {
      return (Object.keys(this.allMembers_).length === 0) &&
          (!this.parent || this.parent.isEmpty());
    }

    /**
     * Gets the value type of the member referenced
     *
     * @param {number | string} key
     * @return {CodeWordsJS.Value.JsValueType | undefined}
     */
    getMember(key: number | string): ScopeMember | undefined {
      const name = makeName_(key);
      let scope: JsScope | undefined = this;
      while (scope) {
        const member = scope.allMembers_[name];
        if (member) {
          return member;
        }
        scope = scope.parent;
      }
      return undefined;
    }

    /**
     * Gets the value type of the member referenced
     *
     * @param {number | string} key
     * @return {CodeWordsJS.Value.JsValueType | undefined}
     */
    getMemberType(key: number | string): JsValueType | undefined {
      const name = makeName_(key);
      let scope: JsScope | undefined = this;
      while (scope) {
        const member = scope.allMembers_[name];
        if (member) {
          return member.valueType;
        }
        scope = scope.parent;
      }
      return undefined;
    }

    /**
     * @param key The key for the requested member.
     * @return The requested member data, if the member exists. Otherwise
     *         undefined.
     */
    getLocalMember(key: number | string): ScopeMember | undefined {
      return this.allMembers_[key];
    }

    /**
     * @return A list of all members defined directly in this scope.
     */
    getAllLocalMembers(): MemberMap {
      return {...this.allMembers_};
    }

    /**
     * Adds a new key, value type pair to the local scope.
     *
     * @param key The string or number that identifies this value.
     * @param valueType The type of value that is stored at this key.
     * @throws If key is not a string or number.
     * @throws If a value type was already assigned to this value.
     */
    addMember(key: number | string, valueType: JsValueType) {
      const keyType = typeof key;
      const isString = keyType === 'string';
      const isNumber = keyType === 'number';

      const name = makeName_(key);
      if (this.allMembers_[name]) {
        throw new Error(`member '${name}' already exists.`);
      }

      const isIdentifier = !ES6_RESERVED_WORDS[key] && IS_IDENTIFIER_NAME.test(name);
      const member: ScopeMember = {
        scope: this,
        key, name, isIdentifier, isNumber, valueType
      };
      this.allMembers_[name] = member;

      if (isIdentifier) {
        // TODO: insert sorted.
        this.identifiers_.push(member);
      }
    }

    /**
     * Retrieves the members that begin with the provided prefix, in this scope
     * and parent scopes, excluding members that are obscured by more local
     * scope members.
     *
     * @param prefix The prefix to match.
     * @param optIgnoreCase Whether to ignore letter casing. On by default.
     * @return An array of match scope members, if any.
     */
    // TODO: Score the results. At least count the depth from the initial scope.
    getMembersByPrefix(prefix: string, optIgnoreCase = true): ScopeMember[] {
      let scope: JsScope | undefined = this;
      const results = this.getLocalMembersByPrefix(prefix, optIgnoreCase);
      const keys = results.map((member) => member.key);
      scope = scope.parent;
      while (scope) {
        const moreMembers = scope.getLocalMembersByPrefix(prefix, optIgnoreCase);
        for (const member of moreMembers) {
          // Linear search is probably fine for small APIs (which is most scopes),
          // but might be poor solution for larger scopes (e.g., global scope).
          if (keys.indexOf(member.key) === -1) {
            results.push(member);
            keys.push(member.key);
          }
        }
        scope = scope.parent;
      }
      return results;
    }

    /**
     * Retrieves the members of this scope that begin with the provided prefix.
     *
     * @param prefix The prefix to match.
     * @param optIgnoreCase Whether to ignore letter casing. On by default.
     * @return An array of match scope members, if any.
     */
    getLocalMembersByPrefix(prefix: string, optIgnoreCase = true): ScopeMember[] {
      const canonicalPrefix = optIgnoreCase ? prefix.toLowerCase() : prefix;
      return this.identifiers_.filter((member) => {
        if (member.isIdentifier) {
          const canonical = optIgnoreCase ? member.name.toLowerCase() : member.name;
          return canonical.indexOf(canonicalPrefix) === 0;
        }
        return false;
      });
    }

    // TODO: deleteMember(..)
  }

  function makeName_(key: number | string): string {
    return typeof key === 'string' ? key : (key as number).toPrecision();
  }
}
