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

/// <reference path="../code_language.ts" />
/// <reference path="../ast/ast_document.ts" />
/// <reference path="../render/meta_line.ts" />
/// <reference path="../render/render_fn.ts" />
/// <reference path="../ui/html_and_css.ts" />
/// <reference path="../ui/drag_in_progress.ts" />
/// <reference path="../util/compute_splice.ts" />

namespace CodeWords.UI {
  import DropTargetWithHtml = CodeWords.Render.DropTargetWithHtml;

  enum AnimatingDropTargetState {
    PREPARED_TO_GROW,
    GROWING,
    AT_TARGET,
    PREPARED_TO_SHRINK,
    SHRINKING,
    DONE
  }

  export type DropTargetAnimCallback = (completed: boolean) => void;

  let debugTarget: AnimatingDropTarget | undefined;

  /**
   * AnimatingDropTarget tracks the animation state for a single DropTarget.
   * The DocumentViewState keeps a list of currently active animations.
   */
  export class AnimatingDropTarget {
    private state_: AnimatingDropTargetState = AnimatingDropTargetState.PREPARED_TO_GROW;

    readonly startWidth: number;
    readonly startHeight: number;

    private animStartTime_ = 0;
    private animEndTimeout_ = -1;  // Actual timeout id assigned in doAnim_()

    private callback_ : DropTargetAnimCallback | undefined = undefined;

    constructor(readonly dropTarget: DropTargetWithHtml,
                readonly targetWidth: number,
                readonly targetHeight: number,
                optCallback?: DropTargetAnimCallback) {
      if (!debugTarget) {
        debugTarget = this;
        if (DEBUG_DROPTARGET_ANIM) {
          console.log('debugTarget: ', dropTarget.html);
        }
      }

      const html = dropTarget.html;
      const bounds = html.getBoundingClientRect();
      this.startHeight = bounds.height;
      this.startWidth = bounds.width;

      if (html.classList.contains('cw-drop-line') && bounds.height === 0) {
        // New insertion line. Match the target width from the beginning.
        html.style.width = targetWidth + 'px';
        // Pause a moment to re-render with new size.
        setTimeout(() => {
          this.startGrowing(optCallback);
        }, 0);
      } else {
        this.startGrowing(optCallback);
      }
    }

    startGrowing(optCallback?: DropTargetAnimCallback) {
      this.doAnim_(
          AnimatingDropTargetState.PREPARED_TO_GROW,
          AnimatingDropTargetState.GROWING,
          AnimatingDropTargetState.AT_TARGET,
          this.targetWidth, this.targetHeight,
          (completed: boolean) => {
            if (optCallback) {
              optCallback(completed);
            }
            if (!completed && this === debugTarget) {
              debugTarget = undefined;
            }
          });
    }

    startShrinking(optCallback?: DropTargetAnimCallback) {
      this.doAnim_(
          AnimatingDropTargetState.PREPARED_TO_SHRINK,
          AnimatingDropTargetState.SHRINKING,
          AnimatingDropTargetState.DONE,
          this.targetWidth, this.targetHeight,
          (completed: boolean) => {
            if (optCallback) {
              optCallback(completed);
            }
            if (this === debugTarget) {
              debugTarget = undefined;
            }
          });
    }

    private doAnim_(
        startState: AnimatingDropTargetState,
        animState: AnimatingDropTargetState,
        doneState: AnimatingDropTargetState,
        targetWidth: number,
        targetHeight: number,
        optCallback?: DropTargetAnimCallback) {
      if (this.callback_) {
        if (DEBUG_DROPTARGET_ANIM) {
          console.log('Cancelling prior callback to proceed to '
              + AnimatingDropTargetState[doneState]);
        }
        this.callback_(false);
      }

      // Create a wrapper object for the callback to use as a unique id.
      const callback = (completed: boolean) => optCallback && optCallback(completed);
      this.callback_ = callback;

      // Presuming the transitionProperty is already set on the HTML
      const bounds = this.dropTarget.html.getBoundingClientRect();
      this.dropTarget.html.style.width = bounds.width + 'px';
      this.dropTarget.html.style.height = bounds.height + 'px';
      this.state_ = startState;
      if (this === debugTarget) {
        if (DEBUG_DROPTARGET_ANIM) {
          console.log(`debugTarget ${this.dropTarget.id}: `
              + `state=${AnimatingDropTargetState[this.state_]}`);
        }
      }

      this.animEndTimeout_ = setTimeout(() => {
        if (this.callback_ === callback) {
          this.animStartTime_ = Date.now();
          this.state_ = animState;
          if (this === debugTarget) {
            if (DEBUG_DROPTARGET_ANIM) {
              console.log('debugTarget: ' + AnimatingDropTargetState[this.state_]);
            }
          }
          this.dropTarget.html.style.width = targetWidth + 'px';
          this.dropTarget.html.style.height = targetHeight + 'px';

          setTimeout(() => {
            if (this.callback_ === callback) {
              this.state_ = doneState;
              if (this === debugTarget) {
                if (DEBUG_DROPTARGET_ANIM) {
                  console.log('debugTarget: ' + AnimatingDropTargetState[this.state_]);
                }
              }

              callback(true);
            } else if(DEBUG_DROPTARGET_ANIM) {
              console.log(
                  'Ignoring start of ' + AnimatingDropTargetState[doneState]);
            }
          }, DROP_TARGET_ANIM_DURATION_MS);
        } else if (DEBUG_DROPTARGET_ANIM) {
          console.log(
              'Ignoring start of ' + AnimatingDropTargetState[doneState]);
        }
      }, 1);
    }
  }
}