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

/// <reference path="../action/action_types.ts" />
/// <reference path="../ast/ast_document.ts" />
/// <reference path="../render/meta_line.ts" />

namespace CodeWords.Reducer {
  // A subset of EditorState
  export interface RenderedLinesInput {
    metalines: Render.MetaLine[];
    renderedLines: Render.RenderedMetaLine[];
  }

  /** Reducer function for EditorState.renderedLines. */
  export function renderedLines(prev: RenderedLinesInput,
                                metalines: Render.MetaLine[]): Render.RenderedMetaLine[] {
    // TODO: Test changes in available character width
    if (prev.metalines === metalines) {
      return prev.renderedLines;
    }

    // TODO: Capture scroll state before changes. What was the last item
    //       interacted with, and where is it on the screen? If not on the
    //       screen, use something around the top or first third.
    let offset = 0;
    const splices = calculateSplices_(prev.metalines, metalines);

    // TODO: Replace all rendered lines if the available character width changes.
    const renderedLines: Render.RenderedMetaLine[] = [...prev.renderedLines];
    for (const splice of splices) {
      // The position referred to by splice may be off because of preceding changes.
      const position = splice.position + offset;
      const newRenderedLines: Render.RenderedMetaLine[] = splice.newMetalines ?
          splice.newMetalines.map((metaline) => Render.renderLine(metaline)) : [];

      renderedLines.splice(position, splice.deleteCount, ...newRenderedLines);

      offset += newRenderedLines.length - splice.deleteCount;
    }
    return renderedLines;
  }

  /** Describes a line level change. Sub-line changes are treated as new changes. */
  interface Splice {
    position: number;
    deleteCount: number;
    newMetalines?: Render.MetaLine[];
  }

  /** Create a list of splices that represents a small set of changes. */
  function calculateSplices_(oldLines: Render.MetaLine[],
                             newLines: Render.MetaLine[])
  : Splice[] {
      // TODO: Don't replace lines that are the same. Use paths as hints.
      return [
        deleteLines_(0, oldLines.length),
        insertLines_(0, newLines)
      ];
    }

  /** Build a insert-only Splice object. */
  function insertLines_(position: number, newMetalines: Render.MetaLine[]): Splice {
    return {
      position,
      deleteCount: 0,
      newMetalines
    };
  }

  /** Build a delete-only Splice object. */
  function deleteLines_(position: number, deleteCount: number): Splice {
    return { position, deleteCount };
  }
}
