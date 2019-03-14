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

/// <reference path="../render/drop_target.ts" />
/// <reference path="../snippet/snippet.ts" />
/// <reference path="./drag_in_progress.ts" />
/// <reference path="../ui/drag_update.ts" />

namespace CodeWords.UI {
  import DropTargetsById = CodeWords.Render.DropTargetsById;
  import DropTargetWithHtml = CodeWords.Render.DropTargetWithHtml;
  import DragInProgress = CodeWords.UI.DragInProgress;

  /**
   * Read-only subset of EditorState used by the Overlay.
   * See Overlay.onStateUpdate(..)
   */
  export interface OverlayState {
    readonly dragInProgress?: DragInProgress;
  }

  /**
   * The overlay that manages the drag shadow and drop targets. It may also be
   * responsible for animation effects such as tutorials in the future.
   */
  export class Overlay {

    private readonly shadowContainer_: HTMLElement;

    private dragListener_: DragUpdateListener;

    private prev_: OverlayState = {};

    private targetsById_?: DropTargetsById;
    private targetDivs_?: HTMLElement[];  // TODO: Replace with static hit boxes

    constructor(private div_: HTMLElement) {
      this.shadowContainer_ = document.createElement('div');
      this.shadowContainer_.classList.add('cw-dragshadow');
      div_.appendChild(this.shadowContainer_);

      div_.onpointerup = this.onPointerUp.bind(this);
      div_.onpointermove = (event) => {
        this.updateShadowPosition(event);
        this.checkHitBoxes(event);  // Is this always fast enough?
      };
    }

    setDragUpdateListener(listener: DragUpdateListener) {
      this.dragListener_ = listener;
    }

    /**
     * Update the DOM for the latest drop targets.
     * @param state The updated state.
     */
    onStateUpdate(state: OverlayState) {
      if (!state.dragInProgress) {
        this.div_.classList.add('cw-hidden');  // Hide while unused
        this.shadowContainer_.innerHTML = '';  // Remove prior shadow
        this.targetsById_ = undefined;
        this.targetDivs_ = undefined;
      } else if (state.dragInProgress !== this.prev_.dragInProgress) {
        this.preprocessTargets(state.dragInProgress.snippet.targets);
      }
      this.prev_ = state;
    }

    /**
     * Initializes a drag from the down event of
     * @param downEvent The initial mouse/touch down event.
     * @param dragInProgress An object capturing all the important details.
     * @param paletteSnippetDiv The div displayed in the palette, that was
     *                          clicked/touched.
     */
    beginDrag(downEvent: PointerEvent,
              dragInProgress: DragInProgress,
              paletteSnippetDiv: HTMLElement) {
      if (DEBUG_DROPTARGET_ANIM) {
        console.log(
            'beginDrag() for targets:', dragInProgress.snippet.targets.map((dt) => dt.id));
      }

      this.div_.classList.remove('cw-hidden');
      this.div_.setPointerCapture(downEvent.pointerId);

      const clone = paletteSnippetDiv.cloneNode(true) as HTMLElement;
      clone.style.touchAction = 'none';
      clone.classList.add('cw-dragged');
      this.shadowContainer_.appendChild(clone);
      this.updateShadowPosition(downEvent, dragInProgress);
    }

    /**
     * Accumulates data about all the pending drop targets.
     * @param targets The available targets.
     */
    preprocessTargets(targets: DropTargetWithHtml[]) {
      const targetsById = {} as DropTargetsById;
      const lineDivs: HTMLElement[] = [];
      const inlineDivs: HTMLElement[] = [];

      // TODO: Calculate static hit boxes
      for (const target of targets) {
        targetsById[target.id] = target;
        // TODO: Separate line divs. Need property to distinguish.
        inlineDivs.push(target.html);
      }

      this.targetsById_ = targetsById;

      // Inline targets are often smaller. test them first.
      this.targetDivs_ = [...inlineDivs, ...lineDivs];
    }

    /**
     * Move the shadow pointer to match the pointer location, preserving offset
     * if precise.
     * @param event The latest pointer event.
     */
    updateShadowPosition(event: PointerEvent, optDrag?: DragInProgress) {
      const drag = optDrag || this.prev_.dragInProgress;
      if (drag) {
        // TODO: Alternate positioning for touch/imprecise drag, with the shadow above the touch.
        const bounds = this.div_.getBoundingClientRect();
        this.shadowContainer_.style.left = (event.pageX - drag.offsetX - bounds.left) + 'px';
        this.shadowContainer_.style.top = (event.pageY - drag.offsetY - bounds.top) + 'px';
      }
    }

    /**
     * Check the latest pointer event against the available hit target hit boxes.
     * Notify the listener if the hovered target changes.
     * @param event The latest pointer event.
     */
    checkHitBoxes(event: PointerEvent) {
      if (this.prev_.dragInProgress && this.dragListener_) {
        if (!this.targetsById_|| !this.targetDivs_) {
          throw new Error('DragInProgress without preprocessed targets.');
        }

        // TODO: Apply pointer-on-shadow offset
        const x = event.pageX;
        const y = event.pageY;

        // Test inline targets first, since they are often smaller.
        const hit = this.checkHitBoxesFromList(x, y, this.targetDivs_) || undefined;
        if (hit !== this.prev_.dragInProgress.hovered) {
          this.dragListener_(DragUpdateType.HOVER_CHANGE, {
            ...this.prev_.dragInProgress,
            hovered: hit
          });
        }
      }
    }

    /**
     * Given a list of elements, test the coordinates for a matching hit,
     * starting from the beginning of the list.
     *
     * @param x Pointer's x coordinate on the page.
     * @param y Pointer's y coordinate on the page.
     * @param targetDivs Elements for potential divs.
     * @return The matching DropTarget. Otherwise, null.
     */
    checkHitBoxesFromList(x: number, y: number, targetDivs: HTMLElement[])
    : DropTargetWithHtml | null {
      // Test inline targets first.
      for (const targetHtml of targetDivs) {
        // TODO: Replace with static, precomputed target locations.
        const bounds = targetHtml.getBoundingClientRect();
        if (bounds.left <= x && x < bounds.right &&
            bounds.top <= y && y < bounds.bottom) {
          const id = targetHtml.id;
          const target = this.targetsById_![id];
          if (!target) {
            throw new Error(`No target "${id}" found for div: ${targetHtml}`);
          }
          return target;
        }
      }
      return null;
    }

    onPointerUp() {
      if (DEBUG_DROPTARGET_ANIM) {
        console.log('onPointerUp():\n\t' +
            `dragListener_ = ${this.dragListener_}\n\tdragInProgress = ${this.prev_.dragInProgress}`);
      }
      if (this.dragListener_ && this.prev_.dragInProgress) {
        this.dragListener_(DragUpdateType.RELEASE, this.prev_.dragInProgress);
      }
    }
  }
}
