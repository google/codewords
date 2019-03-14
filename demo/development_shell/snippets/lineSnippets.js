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

// Construct a list of all suggested snippets that apply to FULL_LINE drop targets.
// Run in the console, or via Chrome Developer Tool Snippets.

var lineSnippets = devshell.state_.snippets.filter(
    (scored) => {
      const lineTargets = scored.targets.filter(
          (target) => {
            return target.type === CodeWords.Render.DropTargetType.FULL_LINE
          });
      return lineTargets.length > 0;
    });

// Evaluate the final line for immediate output.
lineSnippets;
