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

/// <reference path="../ast/dynamic_slots_expression.ts" />
/// <reference path="../ast/expression.ts" />
/// <reference path="../ast/path_fns.ts" />

namespace CodeWords.Snippet {
  import DynamicSlotsExpression = CodeWords.AST.DynamicSlotsExpression;
  import Expression = CodeWords.AST.Expression;

  /** Possible values of InsertionEdit.type. */
  export enum InsertionType {
    /**
     * Insert the expressions before the reference expression, inside a
     * DynamicSlotsExpression.
     */
    BEFORE = 'BEFORE',

    /**
     * Insert the expressions after the reference expression, inside a
     * DynamicSlotsExpression.
     */
    AFTER = 'AFTER',

    /**
     * Append the expressions to the end of the referenced
     * DynamicSlotsExpression.
     */
    APPEND = 'APPEND',

    /**
     * Assigns the child are the referenced path to the given expression.
     * There must only be one expression in the expressions list.
     */
    REPLACE = 'REPLACE'
  }

  /**
   * An InsertionEdit describes a single insertion or replacement edit
   * action, as a result of a single user action such as dropping a Snippet.
   * InsertionEdits are described relative to a specific path.
   */
  export interface InsertionEdit {
    /** The type of the insertion. */
    type: InsertionType;

    /** The document path (slot names) to the reference descendant. */
    path: string[];

    /**
     * The Expressions to insert. If type=replace, must have only one
     * expression.
     */
    expressions: Expression[];

    /**
     * A positive and finite number used to influence the order of the invoking
     * Snippet in the SnippetPalette.
     */
    priority: number;
  }

  /**
   * Applies an InsertionEdit to an expression (usually a document), create
   * clones of the modified expressions along the way (including all parents).
   *
   * @param root The root from which the path is relative.
   * @param edit The edit to apply.
   * @return A new root with the applied modifications.
   * @throws If there is any mismatch between the expression tree structure and
   *         the expectations of the InsertionEdit.
   */
  export function applyInsertion<T extends Expression>(root: T, edit: InsertionEdit): T {
    edit.expressions.forEach((expr, i) => {
      if (expr.language !== root.language) {
        throw new Error(`Expression mismatch: Expected root language ${root.language}. `
                        + `Found expressions[${i}].language ${expr.language}.`);
      }
    });

    const parentPath = (edit.type === InsertionType.APPEND) ? edit.path : edit.path.slice(0, -1);
    const slotName = edit.path[edit.path.length - 1];  // Ignored by append.
    const clonedPath = AST.clonePath(root, parentPath);
    const rootClone = clonedPath[0];
    const parentClone = clonedPath[clonedPath.length - 1];

    switch (edit.type) {
      case InsertionType.BEFORE:
        if (parentClone instanceof DynamicSlotsExpression) {
          const index = parentClone.getSlotNames().indexOf(slotName);
          if (index === -1) {
            throw new Error(`Slot ${slotName} not found on parent ${parentPath}.`);
          }
          parentClone.splice(index, 0, ...edit.expressions);
        } else {
          throw new Error('before requires DynamicSlotsExpression.');
        }
        break;

      case InsertionType.AFTER:
        if (parentClone instanceof DynamicSlotsExpression) {
          const index = parentClone.getSlotNames().indexOf(slotName);
          if (index === -1) {
            throw new Error(`Slot ${slotName} not found on parent ${parentPath}.`);
          }
          parentClone.splice(index + 1, 0, ...edit.expressions);
        } else {
          throw new Error('after requires DynamicSlotsExpression.');
        }
        break;

      case InsertionType.APPEND:
        if (parentClone instanceof DynamicSlotsExpression) {
          parentClone.append(...edit.expressions);
        } else {
          throw new Error('append requires DynamicSlotsExpression.');
        }
        break;

      case InsertionType.REPLACE:
        if (edit.expressions.length !== 1) {
          throw new Error(
              `'replace' requires exactly 1 expression. Found  ${edit.expressions.length}.`);
        }
        parentClone.assignSlot(slotName, edit.expressions[0]);
        break;

      default:
        throw new Error('Invalid InsertionType: ' + edit.type);
    }

    return rootClone as T;
  }

  /**
   * A map of InsertionEdit objects keyed by sting ids, usually an id of the
   * DropTarget it relates to.
   */
  export type InsertionEditsById = {[key: string]: InsertionEdit};
}
