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

namespace CodeWords.Util {
  /**
   * An object describing a splice edit. The edit is described in two parts: a
   * deletion of a number of items, followed by an insertion at the same
   * location. Either the deletion count or the insertion count may be zero.
   *
   * The list of inserted items is not included in this structure, and it is
   * assumed the context of the usage will include the list (possibly also
   * offset by the position, in the case of a diff).
   */
  export interface Splice {
    /** The index of the insertion/deletion. */
    position: number;
    /**
     * The count of lines to be removed from the initial list state, at position and before
     * insertion.
     */
    deleteCount: number;
    /** The count of lines to be added into the list at, at position. */
    insertCount: number;
  }

  /**
   * Calculates a Splice object that describes the edit from array a to array b.
   * @param a The first array, relative to which items may be deleted or inserted into.
   * @param b The second array, that may contain the content to be inserted.
   * @return A Splice, or null if the contents and length are identical.
   */
  export function computeDiffSplice<T>(a: T[], b: T[]): Splice|null {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);

    let start;
    for (start = 0; start < minLen; ++start) {
      if (a[start] !== b[start]) {
        break;
      }
    }
    const maxFromEnd = minLen - start;
    if (maxFromEnd === 0 && a.length === b.length) {
      return null;  // The arrays are the same.
    }
    let fromEnd;
    for (fromEnd = 0; fromEnd < maxFromEnd; ++fromEnd) {
      if (a[a.length - fromEnd - 1] !== b[b.length - fromEnd - 1]) {
        break;
      }
    }

    return {
      position: start,
      deleteCount: a.length - start - fromEnd,
      insertCount: b.length - start - fromEnd
    };
  }
}