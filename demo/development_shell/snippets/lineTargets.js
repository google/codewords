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

// Construct a list of all FULL_LINE targets in renderedLines.
// Run in the console, or via Chrome Developer Tool Snippets.

var lineTargets = devshell.state_.renderedLines.reduce(
    (prev, line) => {
      if (line.beforeLineTarget) {
        prev.push(line.beforeLineTarget);
      }
      if (line.afterLineTarget) {
        prev.push(line.afterLineTarget);
      }
      return prev;
    }, []);

// Evaluate the final line for immediate output.
lineTargets;
