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

/// <reference path="ast/expression.ts" />
/// <reference path="ast/expression_type.ts" />
/// <reference path="render/meta_line.ts" />
/// <reference path="render/span.ts" />


namespace CodeWords {
  import Expression = CodeWords.AST.Expression;
  import ExpressionConfig = CodeWords.AST.ExpressionConfig;
  import ExpressionType = CodeWords.AST.ExpressionType;
  import Scope = CodeWords.AST.Scope;
  import MetaLine = CodeWords.Render.MetaLine;
  import Span = CodeWords.Render.Span;

  /**
   * A set of functions pertaining to a specific Code Words language
   * implementation.
   *
   * References to a CodeLanguage object are often used by many Code Words
   * objects to denote the contents are defined in that language. For example,
   * an Editor and a Snippet will each maintain a reference to a CodeLanguage,
   * and the Editor will test that both references refer to the same instance
   * before inserting the Snippet.
   *
   * CodeLanguage objects are immutable.
   */
  export abstract class CodeLanguage {
    /** The name of the language, as seen in error strings. */
    name: string;

    /**
     * A complete mapping of expression types names to ExpressionTypes in this
     * language. Each AST expression node in the language declares one of these
     * types.
     *
     * Each language has a fixed and finite set of expression types. These are
     * used to define the allowed structure and render hints for things like
     * punctuation, indentation, and syntax highlighting.
     *
     * <section>
     * <header>Example 1: Arithmetic</header>
     *
     * A simple arithmetic language might be composed of 'number' and 'add'
     * expressions. The code "1 + 2" could be expressed by the tree:
     *
     * <pre><code>
     * number:1   number:2
     *       \    /
     *        add
     * <code></pre>
     *
     * Note that the each expression can carry additional data. Each 'number'
     * node includes its value.
     *
     * The type information describes the role of the node and constrains how
     * they can be composed. In the above example, an 'add' node can have a
     * 'number' child (or even another 'add'), but a 'number' cannot have any
     * child. Numbers are always leaf nodes of the tree.
     * </section>
     *
     * <section>
     * <header>Example 2: Parts of speech</header>
     *
     * One can also compare to natural language. "I like cake." could be
     * described in terms of expression types 'noun', 'verb', 'verb phrase',
     * and 'sentence'. The expression type, or "part of speech",
     *
     * <pre><code>
     *    verb:"like"   noun:"cake"
     *             \    /
     * noun:"I"   verb phrase
     *       \    /
     *      sentence
     * <code></pre>
     *
     * Note that each AST expression does not necessarily have an rendered
     * representation. Some act as grouping nodes, like the verb phrase and the
     * sentence (if you don't count the period).
     * </section>
     *
     * Explore literature on computer language parsers for more details.
     */
    readonly types: { [key: string]: ExpressionType } = Object.create(null);

    /**
     * Constructs a new CodeLanguage.
     *
     * @param name The name of the language, as seen in error strings.
     * @param expressionTypes Type definitions for the expressions in this language.
     * @param optInitBeforeFreeze Optional initializer function called before freezing.
     *                            Binds the language to this and first argument.
     */
    protected constructor(name: string,
                          expressionTypes: ExpressionType[],
                          optInitBeforeFreeze?: () => {}) {
      if (typeof name !== 'string') {
        throw new Error('Missing CodeLanguage name. Found: ' + name);
      }
      this.name = name;

      if (!expressionTypes) {
        throw new Error(`CodeLanguage '${name}' define expression types.`);
      }
      for (const exprType of expressionTypes) {
        if (this.types[exprType.name]) {
          throw new Error(`Duplicate ExpressionTypes for '${exprType.name}'.`);
        }
        this.types[exprType.name] = exprType;
      }

      // Allow subclass to apply edits prior to freezing the class.
      if (optInitBeforeFreeze) {
        // Bind language to both 'this' and the first argument. The first
        // argument can be ignored, but is necessary with arrow functions,
        // where this is already bound to the declaration scope.
        optInitBeforeFreeze.call(this, this);
      }

      // Must define at least one type id.
      const keys = Object.keys(this.types);
      if (!expressionTypes.length) {
        throw new Error('Must define expression types.');
      }
      for (const typeName of keys) {
        AST.ExpressionType.validateName(typeName);
        const exprType = this.types[typeName];
        if (!(exprType instanceof ExpressionType)) {
          throw new Error(`Not an ExpressionType: ${typeName}`);
        }
        if (typeName !== exprType.name) {
          throw new Error(`Type name '${typeName}' maps to '${exprType.name}'.`);
        }
      }

      // Make immutable
      Object.freeze(this.types);
      Object.freeze(this);
    }

    /**
     * Constructs a new Expression of the requested type.
     *
     * @param typeOrTypeName The ExpressionType or its type name.
     * @param optConfig An optional configuration for the new Expression.
     * @return A new Expression of the requested type.
     */
    newExpression(typeOrTypeName: string | ExpressionType,
                  optConfig?: ExpressionConfig): Expression {
      let exprType;
      if (typeOrTypeName instanceof ExpressionType) {
        exprType = typeOrTypeName;
        if (this.types[exprType.name] !== exprType) {
          throw new Error(`${exprType} is not a member of ${this}.`);
        }
      } else {
        exprType = this.types[typeOrTypeName];
        if (!exprType) {
          throw new Error(`Unrecognized ExpressionType name "${typeOrTypeName}"`);
        }
      }
      return exprType.newExpression(this, optConfig);
    }

    /** @return Short description for developers / debugging. */
    toString() {
      return `CodeLanguage '${this.name}'`;
    }

    /**
     * Constructs a sequence of {@link MetaLine}s that divide the
     * {@link Expression}s {@code exprs} into lines when rendered as a string.
     * Each expression in {@code exprs} will start on a new line, though an
     * expression may be rendered across multiple lines. For example, a block
     * sub-expressions such as the body of a function or loop may be divided
     * into multiple lines, with a {@link MetaLine} for each child.
     *
     * @param expressions The expressions to analyze.
     * @param optPath The path to the root element of this line.
     * @param optScope The scope where the expressions on this line are defined.
     * @param optIndentCount A count of indents (tabs) used in recursion.
     * @return The {@link MetaLine}s that divide the expressions.
     */
    abstract buildLines(expressions: Expression,
                        optPath?: string[],
                        optScope?: Scope,
                        optIndentCount?: number): MetaLine[];

    /**
     * Describes the line to be rendered as a Span. The expression may be from
     * a MetaLine or a Snippet. Snippet lines begin with an empty path.
     *
     * @param expr The expr to render as a line.
     * @param path The path to the expression. May be empty, such as when
     *             rendering a snippet line.
     * @return The Span that contains the text contents.
     */
    abstract buildLineSpan(expr: Expression, path: string[]): Span;
  }
}
