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

namespace CodeWords.UI {
  // TODO: Replace these constants with files for editor and preprocessor support.

  export const DEFAULT_FONT_FAMILY = 'monospace';
  export const DEFAULT_FONT_PX = 20;
  export const DROP_TARGET_ANIM_DURATION_MS = 300;

  const DEFAULT_FONT = `${DEFAULT_FONT_PX}px ${DEFAULT_FONT_FAMILY}`;

  export const EDITOR_HTML = `
<div class="codewords-editor">
  <div class="cw-overlay cw-hidden"></div>
  <div class="cw-docview"></div>
  <div class="cw-drawer">
    <div class="cw-input-bar">
      <input type="text" class="cw-input" placeholder="Search">
    </div>
    <div class="cw-palette"></div>
  </div>
</div>`;

  /**
   * Embedded CSS string used by inject() to insert the CodeWords styles into the page.
   * @type {string}
   */
  export const STYLESHEET_CSS = `
.codewords-editor {
  border: 0px;
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  flex-flow: column nowrap;
  font: ${DEFAULT_FONT};
  justify-content: flex-end;
  left: 0;
  margin: 0px;
  padding: 0px;
  position: absolute;
  right: 0;
  top: 0;
  touch-action: none;
  user-select: none;

  /* TODO: Need overscroll indicator for Android. */
  -webkit-overflow-scrolling: touch;
}

.cw-docview {
  flex-grow: 1;
  overflow-y: scroll;
  touch-action: pan-y;
  width: 100%;
}

.cw-dragshadow {
  border: 0;
  margin: 0;
  padding: 0;
  position: absolute;
}

.cw-drawer {
  background-color: #EEE;
  width: 100%;
}

.cw-drop-inline {
  display: inline-block;  /* TODO: Solve interactions with line breaks. */
  text-align: center;
  transition: width ${DROP_TARGET_ANIM_DURATION_MS}ms;
}

.cw-drop-inline.cw-drop-pending {
  background-color: rgb(255, 255, 96);
  border-radius: ${DEFAULT_FONT_PX}px;
  margin-top: -2px;
  margin-bottom: -2px;
  padding-top: 2px;
  padding-bottom: 2px;
}

.cw-drop-inner {
  display: inline-block;
}

.cw-drop-line {
  transition: height ${DROP_TARGET_ANIM_DURATION_MS}ms;
}

.cw-drop-line.cw-drop-pending {
  background-color: rgb(255, 255, 96);
  border-radius: ${DEFAULT_FONT_PX}px;
  overflow-y: hidden;
}

.cw-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.cw-hidden {
  display: none !important;
}

.cw-input-bar {
  width: 100%;
}

.cw-input {
  font: ${DEFAULT_FONT};

  /* TODO: Adjust these programmatically for older systems. */
  margin: 4px 4px 2px;
  width: inherit;
  width: -webkit-fill-available;
  width: fill;
}

.cw-palette {
  height: 7em;
  margin: 8px;
  width: 100%;
}

.cw-snippet {
  display: inline-block;
  background-color: rgb(216, 216, 216);
  border: solid 1px rgb(216, 216, 216);  /* Same color as background, until drawn */
  border-radius: ${DEFAULT_FONT_PX}px;
  box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: ${DEFAULT_FONT_PX / 2}px;
  padding: 1px ${DEFAULT_FONT_PX * .3}px;

  /* Do not set a margin top or left on the snippet. It breaks dragshadow alignment. */
  margin-top: 0 !important;
  margin-left: 0 !important;
}

.cw-snippet.cw-dragged {
  background-color: rgba(236, 236, 236, 0.9);
  box-shadow:0px 3px 6px rgba(0, 0, 0, 0.4);
  margin: 0;
}
`;
}
