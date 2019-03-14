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
/// <reference path="../ui/drag_in_progress.ts" />
/// <reference path="../util/compute_splice.ts" />

namespace CodeWords.UI {
  import computeDiffSplice = CodeWords.Util.computeDiffSplice;
  import Splice = CodeWords.Util.Splice;
  import RenderedMetaLine = CodeWords.Render.RenderedMetaLine;
  import DragInProgress = CodeWords.UI.DragInProgress;

  /**
   * Enables logging in an effort to track a bug in the animation state.
   * Remove when the bug is squashed.
   */
  export const DEBUG_DROPTARGET_ANIM = false;

  export type DocumentClickListener =
      (event: MouseEvent, clickIds: string[], path: string[]) => boolean;

  /**
   * Read-only subset of EditorState used by the DocumentView.
   * See DocumentView.onStateUpdate(..)
   */
  export interface DocumentViewState {
    readonly renderedLines: Render.RenderedMetaLine[];
    readonly dragInProgress?: DragInProgress;
  }

  /**
   * Manages the rendering of lines of the document.
   */
  export class DocumentView {
    /** The root div of this component. */
    private div_: HTMLElement;

    /** The lines of code rendered into HTML, with drop targets. */
    private prev_: DocumentViewState = {
      renderedLines: []
    };

    private docClickListener_: DocumentClickListener | undefined;

    private onClickHandler_: EventListenerObject = {
      handleEvent: (event: MouseEvent) => {
        if (this.docClickListener_) {
          const html = event.currentTarget as HTMLElement;
          const clickData = html.dataset['cwClick'];
          if (!clickData) {
            console.error('DocumentView.onClickHandler_: missing data-cw-click', html);
            throw new Error('missing data-cw-click: ' + html);
          }
          const pathData = html.dataset['cwPath'];
          if (!pathData) {
            console.error('DocumentView.onClickHandler_: missing data-cw-path', html);
            throw new Error('missing data-cw-path: ' + html);
          }

          const clickIds = clickData.split(' ');
          const path = pathData.split(' ');
          if(this.docClickListener_(event, clickIds, path)) {
            // Event was handled.
            event.stopPropagation();
          }
        }
        return false;
      }
    };

    private activeDropTargets_: AnimatingDropTarget[] = [];

    /**
     * @param div The <div> to populate with the document view HTML.
     *            Specifically, the `cw-docview` of the injected
     *            CodeWords.UI.EDITOR_HTML.
     */
    constructor(div: HTMLElement) {
      this.div_ = div;
    }

    setClickListener(listener: DocumentClickListener) {
      this.docClickListener_ = listener;
    }

    /**
     * Update the DOM for the latest rendered document lines.
     * @param state The updated state.
     */
    // TODO: Break this into smaller functions... someday
    onStateUpdate(state: DocumentViewState) {
      const {dragInProgress, renderedLines} = state;

      const diffSplice = computeDiffSplice(this.prev_.renderedLines, renderedLines);
      const dragInProgressChanged = this.prev_.dragInProgress !== state.dragInProgress;

      if (!diffSplice && !dragInProgressChanged) {
        return; // No update.
      }

      // TODO: Capture scroll state. Try to preserve the position of the
      //       latest focused line or the line at the top.

      if (diffSplice) {
        this.renderUpdatedLines_(renderedLines, diffSplice);
      }

      if (dragInProgressChanged) {
        this.updateDragTargets_(dragInProgress);
      }

      this.prev_ = {renderedLines, dragInProgress};
    }


    renderUpdatedLines_(renderedLines: RenderedMetaLine[], splice: Splice) {
      const oldLines = this.prev_.renderedLines;

      // Remove deleted lines from DOM and targets
      const deleteEnd = splice.position + splice.deleteCount;
      for (let i = splice.position; i < deleteEnd; ++i) {
        const line = oldLines[i];
        if (line.beforeLineTarget) {
          this.div_.removeChild(line.beforeLineTarget.html);
        }
        if (line.afterLineTarget) {
          this.div_.removeChild(line.afterLineTarget.html);
        }

        this.div_.removeChild(line.html);
      }

      // Begin updating using the new array
      let i = splice.position;
      let insertRef = null;  // I.e., append to the end.
      if (i < oldLines.length - splice.deleteCount) {
        const nextLine = renderedLines[i];
        insertRef = nextLine.beforeLineTarget ? nextLine.beforeLineTarget.html : nextLine.html;
      }

      const insertEnd = splice.position + splice.insertCount;
      let prevLineHasAfterTarget: boolean;
      if (i === 0) {
        // Insert from the beginning.
        prevLineHasAfterTarget = false;
      } else {
        const prevLine = renderedLines[i - 1];
        prevLineHasAfterTarget = !!prevLine.afterLineTarget;
      }

      for (i; i < insertEnd; ++i) {
        const line = renderedLines[i];

        // Register click handler
        const clickables = line.html.querySelectorAll('[data-cw-click]');
        for (let i = 0; i < clickables.length; ++i) {
          // Remove first to dedupe (just in case).
          clickables.item(i).removeEventListener('click', this.onClickHandler_);
          clickables.item(i).addEventListener('click', this.onClickHandler_);
        }

        const beforeTarget = line.beforeLineTarget;
        if (beforeTarget) {
          if (prevLineHasAfterTarget) {
            console.warn('WARNING: Adjacent line targets can be confusing.');
          }
          this.div_.insertBefore(beforeTarget.html, insertRef);
        }
        this.div_.insertBefore(line.html, insertRef);

        const afterTarget = line.afterLineTarget;
        prevLineHasAfterTarget = !!line.afterLineTarget;
        if (afterTarget) {
          this.div_.insertBefore(afterTarget.html, insertRef);
        }
      }
    }

    updateDragTargets_(dragInProgress: DragInProgress | undefined) {
      const prevTargets =
          this.prev_.dragInProgress ? this.prev_.dragInProgress.snippet.targets : [];
      const newTargets = dragInProgress ? dragInProgress.snippet.targets : [];
      const spliceTargets = computeDiffSplice(prevTargets, newTargets);

      if (spliceTargets) {
        if (DEBUG_DROPTARGET_ANIM) {
          console.log('updateDragTargets_: ', spliceTargets);
        }

        // Clean up any targets no longer in use... (aka: how not to do functional programming)
        const deleteEnd = spliceTargets.position + spliceTargets.deleteCount;
        for (let i = spliceTargets.position; i < deleteEnd; ++i) {
          let found = false;

          const html = prevTargets[i].html;

          if (DEBUG_DROPTARGET_ANIM) {
            console.log(
                'activeDropTargets_ before splice: ',
                this.activeDropTargets_.map((dt) => dt.dropTarget.id));
          }
          for (const activeDT of this.activeDropTargets_) {
            if (activeDT.dropTarget.html === html) {
              found = true;
              activeDT.startShrinking((completed: boolean) => {
                if (DEBUG_DROPTARGET_ANIM) {
                  console.log(
                      `shrink ${activeDT.dropTarget.id} completed?: ${completed}`);
                }
                if (completed) {
                  const index = this.activeDropTargets_.indexOf(activeDT);
                  this.activeDropTargets_.splice(index, 1);
                } else if (DEBUG_DROPTARGET_ANIM) {
                  console.log('<<< incomplete shrink not removed.');
                }
                html.classList.remove('cw-drop-pending');
                html.style.cssText = ''; // Remove locally defined style
              });
              break;
            }
          }
          if (!found) {  // TODO: Remove this when tested and confirmed WAI.
            if (DEBUG_DROPTARGET_ANIM) {
              console.warn(
                  'Removing target without a match: ' + prevTargets[i].id);
            }
            html.classList.remove('cw-drop-pending');
            html.style.cssText = ''; // Remove locally defined style
          }
        }

        if (spliceTargets.insertCount) {
          // TODO: compute compound drop targets for targets on the same line.
          const minWidth = dragInProgress!.widthPx;
          const minHeight = dragInProgress!.heightPx;

          const insertEnd = spliceTargets.position + spliceTargets.insertCount;
          for (let i = spliceTargets.position; i < insertEnd; ++i) {
            const target = newTargets[i];
            const html = target.html;
            html.classList.add('cw-drop-pending');

            const curBounds = html.getBoundingClientRect();
            const targetWidth = Math.max(minWidth, curBounds.width);
            const targetHeight = Math.max(minHeight, curBounds.height);
            if (html.classList.contains('cw-drop-line') && curBounds.height === 0) {
              // New insertion line. Match the width with the snippet width.
              html.style.width = minWidth + 'px';
              // Give it a moment to recalc the new size.
              if (DEBUG_DROPTARGET_ANIM) {
                console.log('Scheduling delayed add: ' + target.id, target);
              }
              setTimeout(() => {
                if (this.prev_.dragInProgress === dragInProgress) {
                  if (DEBUG_DROPTARGET_ANIM) {
                    console.log('delayed add: ' + target.id, target);
                  }
                  this.activeDropTargets_.push(new AnimatingDropTarget(
                      target, minWidth, targetHeight));
                } else if (DEBUG_DROPTARGET_ANIM) {
                  console.warn(
                      'scheduled add is no longer the current anim for' + target.id, target);
                }
              }, 1);
            } else {
              if (DEBUG_DROPTARGET_ANIM) {
                console.log('adding: ' + target.id, target);
              }
              this.activeDropTargets_.push(new AnimatingDropTarget(
                  target, targetWidth, targetHeight));
            }
          }
          if (DEBUG_DROPTARGET_ANIM) {
            console.log(
                'After new targets: activeDropTargets_: ',
                this.activeDropTargets_.map((dt) => dt.dropTarget.id));
          }

          // TODO: Freeze line breaks during drag, specifically for lines
          //       with drag targets and possibly expanded width.
        }
      }
    }
  }
}
