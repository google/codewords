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

/// <reference path="../ui/drag_in_progress.ts" />
/// <reference path="../ui/drag_update.ts" />
/// <reference path="./type_keys.ts" />

namespace CodeWords.Action {
  import DragInProgress = CodeWords.UI.DragInProgress;
  import DragUpdateType = CodeWords.UI.DragUpdateType;

  /** Action marking when the user begins dragging a snippet. */
  export interface SnippetDragUpdateAction {
    type: TypeKeys.SNIPPET_DRAG_UPDATE;
    dragInProgress: DragInProgress | null;
  }

  /** Creates an action marking when the user begins dragging a snippet. */
  export function snippetDragUpdate(type: DragUpdateType, dragInProgress: DragInProgress | null)
  : SnippetDragUpdateAction {
    return {
      type: TypeKeys.SNIPPET_DRAG_UPDATE,
      dragInProgress
    };
  }
}
