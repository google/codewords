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
/// <reference path="../action/type_keys.ts" />
/// <reference path="../ui/drag_in_progress.ts" />

namespace CodeWords.Reducer {
  import ActionTypes = CodeWords.Action.ActionTypes;
  import TypeKeys = CodeWords.Action.TypeKeys;
  import DragInProgress = CodeWords.UI.DragInProgress;

  /**
   * Applies the updated drag state upon drag update.
   * @param prev The previous drag state.
   * @param action The current action.
   * @return The resulting drag state.
   */
  export function dragInProgress(prev: DragInProgress | undefined,
                                 action: ActionTypes)
  : DragInProgress | undefined {
    switch (action.type) {
      case TypeKeys.SNIPPET_DRAG_UPDATE:
        return action.dragInProgress ? action.dragInProgress : undefined;

      default:
        return prev;
    }
  }
}
