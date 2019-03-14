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
/// <reference path="js_value_type_flags.ts" />

namespace CodeWordsJS.Value {
  import ValueType = CodeWords.AST.ValueType;

  import JsValueTypeFlags = CodeWordsJS.Value.JsValueTypeFlags;

  export interface JsValueTypeOptions {
    /** Name used in developer oriented messaging. */
    readonly devName?: string;

    /**
     * Specification of the arguments to the function or constructor. In the case of a
     * constructor, the return type of the function is the type of the new instance.
     */
    readonly functionSpec?: JsFunctionSpec;

    /** The members of the object or namespace, if any. */
    readonly memberScope?: JsScope;

    // TODO: readonly or assignable? readonly globals. const values. readonly properties.
  }

  /**
   * A description of a variable type or value in JavaScript.
   */
  // TODO: Union types including 'any', if possible.
  export class JsValueType implements ValueType {
    /** Name used in developer oriented messaging. */
    readonly devName_: string;

    /**
     * Specification of the arguments to the function or constructor. In the case of a
     * constructor, the return type of the function is the type of the new instance.
     */
    readonly functionSpec: JsFunctionSpec | undefined;

    /** The members of the object or namespace, if any. */
    readonly memberScope: JsScope | undefined;

    /**
     *
     * @param {number} flags
     * @param {CodeWordsJS.Value.JsValueTypeOptions} options
     */
    constructor(/** flags The type flags for this value type. A union of JsValueTypeFlags. */
                readonly flags: number,

                /** Options for this ValueType. */
                options: JsValueTypeOptions = {}) {
      this.devName_ = buildDevName(flags, options);
      this.functionSpec = options.functionSpec;
      this.memberScope = options.memberScope;

      validateJsType_(this);

      if (this.flags < JsValueTypeFlags.OBJECT) {
        Object.freeze(this);
      }
    }

    isAssignableFrom(otherValueType: ValueType): boolean {
      const other = otherValueType as JsValueType;
      if (other.flags === undefined) {
        throw new Error('other must be JsValueType');
      }
      if (this === other) {
        return true;
      }
      // TODO: Allow previously unassigned varaibles to be assigned to anything.
      if (this.flags === JsValueTypeFlags.NEVER || this.flags === JsValueTypeFlags.UNDEFINED) {
        return false;
      }
      if (this.isConstructor() || other.isConstructor()) {
        // TODO: Maybe check if other class is a subclass of this class, via memberScopes?
        return false;
      }
      if (this.isObject()) {
        let otherScope = other.memberScope;
        while (otherScope) {
          if (otherScope === this.memberScope) {
            return true; // Other is a subclass.
          }
          otherScope = otherScope.parent;
        }
        return false;
      } else if (other.isObject()) {
        return false;
      }

      console.warn(`UNIMPLEMENTED: this ${this} isAssignableFrom(other = ${other})`);
      return false;
    }

    /**
     * @return Whether this value is an object, including functions or arrays.
     */
    isObject(): boolean {
      return (this.flags & JsValueTypeFlags.OBJECT) === JsValueTypeFlags.OBJECT;
    }

    // TODO: isPlainObject(): Include namespaces? Include class instances?

    /**
     * @return Whether this value is plain object that is not a function or array. Includes
     *         namespace objects.
     */
    isNamespace(): boolean {
      return (this.flags === JsValueTypeFlags.NAMESPACE);
    }

    /**
     * @return Whether this value is an array type.
     */
    isArray(): boolean {
      return (this.flags === JsValueTypeFlags.ARRAY);
    }

    /**
     * @return Whether this value is a callable function. Does not include
     *         constructors.
     */
    isFunction(): boolean {
      return (this.flags & JsValueTypeFlags.CONSTRUCTOR) === JsValueTypeFlags.FUNCTION;
    }

    /**
     * @return Whether this value is a callable function. Does not include
     *         constructors.
     */
    isConstructor(): boolean {
      return (this.flags & JsValueTypeFlags.CONSTRUCTOR) === JsValueTypeFlags.CONSTRUCTOR;
    }

    /**
     * @return True if this scope has addressable members.
     */
    hasMembers() {
      return !!this.memberScope && !this.memberScope.isEmpty();
    }

    /**
     * @return Developer oriented string descriptive string.
     */
    toString(): string {
      return this.devName_;
    }
  }

  function validateJsType_(type: JsValueType) {
    if (type.flags < JsValueTypeFlags.OBJECT) {
      switch (type.flags) {
        case JsValueTypeFlags.NEVER:
        case JsValueTypeFlags.UNDEFINED:
        case JsValueTypeFlags.NULL:
          // TODO: Check no members, no function spec, no instance scope.
          return;
        case JsValueTypeFlags.BOOLEAN:
        case JsValueTypeFlags.NUMBER:
        case JsValueTypeFlags.STRING:
          // TODO: Check no function spec, no instance scope.
          return;

        default:
          throw new Error('Invalid type flag: ' + type.flags);
      }
    }
    if (type.flags === JsValueTypeFlags.BOOLEAN_OBJ ||
        type.flags === JsValueTypeFlags.NUMBER_OBJ ||
        type.flags === JsValueTypeFlags.STRING_OBJ) {
      return;
    }

    const allowedBits =
        JsValueTypeFlags.OBJECT | JsValueTypeFlags.NAMESPACE | JsValueTypeFlags.ARRAY |
        JsValueTypeFlags.FUNCTION | JsValueTypeFlags.CONSTRUCTOR;
    if (!type.isObject() || (type.flags & ~allowedBits) !== 0) {
      throw new Error('Invalid type flag: ' + type.flags);
    }
    if (type.isFunction() || type.isConstructor()) {
      if (!type.functionSpec) {
        throw new Error(type.devName_ + ' missing functionSpec');
      }
      if (!Array.isArray(type.functionSpec.args)) {
        throw new Error(type.devName_ + ' missing functionSpec.args');
      }
    }
  }

  function buildDevName(flags: number, options: JsValueTypeOptions = {}) : string {
    const flagsName = JsValueTypeFlags[flags] || flags;
    if ((flags & JsValueTypeFlags.FUNCTION) === JsValueTypeFlags.FUNCTION) {
      if (!options.devName) {
        const returnType = options.functionSpec && options.functionSpec.returnType;
        if (returnType) {
          return `JsValueType(${returnType} ${flagsName})`;
        }
      }
    }
    const devNamePrefix = options.devName ? `${options.devName} ` : '';
    return `JsValueType(${devNamePrefix}flagsName})`;
  }
}
