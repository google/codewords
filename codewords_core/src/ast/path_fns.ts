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

/// <reference path="slots.ts" />

namespace CodeWords.AST {
  /**
   * Creates a clone of root Expression, with all expressions along the path
   * cloned. Descendants outside the path will remain original references.
   *
   * All clones along the path remain mutable / unfrozen.
   *
   * @param root The root expression to clone.
   * @param path Slot names of the descendant path to clone.
   * @return A list of of the cloned items, starting with the cloned root.
   */
  export function clonePath(root: Expression, path: string[]): Expression[] {
    const rootClone = root.makeShallowClone();
    const clonedPath = [rootClone];
    let parentClone = rootClone;
    path.forEach((pathPart, i) => {
      const child = parentClone.getChild(pathPart);
      if (!child) {
        throw new Error('Invalid path: ' + path);
      }
      const clone = child.makeShallowClone();
      parentClone.assignSlot(pathPart, clone);
      parentClone = clone;
      clonedPath.push(clone);
    });
    return clonedPath;
  }
}
