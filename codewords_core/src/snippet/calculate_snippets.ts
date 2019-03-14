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

/// <reference path="./snippet.ts" />
/// <reference path="./snippet_context.ts" />
/// <reference path="./suggest_fn.ts" />

namespace CodeWords.Snippet {
  import Snippet = CodeWords.Snippet.Snippet;
  import SnippetContext = CodeWords.Snippet.SnippetContext;
  import DropTargetWithExpressions = CodeWords.Render.DropTargetWithExpressions;

  // TODO: Differentiate calculated max # snippets from displayed max
  const MAX_SNIPPETS = 10;


  /**
   * Query all snippet suggestion function for the current context.
   *
   * @param suggestSnippetFns The snippet suggesting functions.
   * @param context A subset of the state of the editor relevant to selecting
   *                Snippets.
   * @return A prioritized set of suggested snippets.
   */
  export function calculateSnippets(suggestSnippetFns: SuggestFn[],
                                    context: SnippetContext)
  : ScoredSnippetWithTargets[] {
    if (!context.astDoc ||
        !context.snippetSuggestFns.length ||
        !context.renderedLines.length) {
      return [];
    }

    const snippets: Snippet[] = [];
    for (const snippetsFromContextFn of suggestSnippetFns) {
      for (const snippet of snippetsFromContextFn(context)) {
        snippets.push(snippet);
      }
    }
    const scoredSnippets = calculateSnippetScores(snippets, context);

    // Highest priority first.
    scoredSnippets.sort((a, b) => (b.score - a.score));
    return scoredSnippets.slice(0, MAX_SNIPPETS);
  }

  /**
   * Score a set of Snippets by computing all matching drop targets.
   *
   * @param snippets The set of snippets to score.
   * @param context The context within which the Snippets will be shown.
   * @return The scored snippets with potential DropTargets attached.
   */
  export function calculateSnippetScores(snippets: Snippet[], context: SnippetContext) {
    if (!context.astDoc) {
      throw new Error('Missing AstDocument');
    }
    const astDoc = context.astDoc;

    // Accumulate a list of all DropTargets with relevant expressions.
    const targetsWithExprs: DropTargetWithExpressions[] =
        context.renderedLines.map((metaline) => metaline.dropTargets)
            .reduce((accum, targetsInLine) => {
              for (const target of targetsInLine) {
                const path = target.path;
                const parent = astDoc.getDescendant(path, 0, path.length - 1);
                const expr = parent ? parent.getChild(path[path.length - 1]) : astDoc;
                const targetWithExprs: DropTargetWithExpressions = {
                    ...target, expr, parent
                };
                accum.push(targetWithExprs);
              }
              return accum;
            }, [] as DropTargetWithExpressions[]);

    // Test each snippet against every target, saving it if it has any matches.
    return snippets.reduce(
        (accum: ScoredSnippetWithTargets[], snippet) => {
          let score = 0;
          const edits: InsertionEditsById = {};
          const targetsForThisSnippet: DropTargetWithExpressions[] = [];

          for (const target of targetsWithExprs) {
            let edit = snippet.maybeBuildInsertionEdit(target);
            if (edit && target.mutateInsertionEdit) {
              edit = target.mutateInsertionEdit(edit, context, target);
            }
            if (edit && edit.priority > 0) {
              // TODO: Explore other score accumulation math.
              score += edit.priority;
              targetsForThisSnippet.push(target);
              edits[target.id] = edit;
            }
          }

          if (score > 0) {
            accum.push({
              snippet, score, targets: targetsForThisSnippet, edits
            });
          }
          return accum;
        }, [] as ScoredSnippetWithTargets[]);
  }
}
