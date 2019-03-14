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

namespace CodeWords.Search {
  const LOG_RAW_TRACES = true;
  const STANDARD_INDENT = '   ';

  export interface ParseTrace {
    parser: SearchParser;
    searchText: string;
    inputStart: number;
    prevParse?: PendingParse;
    outputs?: PendingParse[];
    error?: Error;
    delegationInfo?: DelegatingParse;
  }

  interface DelegationTreeNode {
    parser: SearchParser;
    input: string;
    inputStart: number;
    delegates: DelegationTreeNode[];
    traces: ParseTrace[];
  }

  function buildTreeNodePath(trace: ParseTrace): DelegationTreeNode {
    let node: DelegationTreeNode;
    if (trace.delegationInfo) {
      const stack = trace.delegationInfo.delegationStack;
      const len = stack.length;
      node = {
        parser: stack[len - 1].parser,
        input: trace.searchText,
        inputStart: stack[len - 1].inputStart,
        traces: [trace],
        delegates: [],
      };
      for (let i = len - 2; i >= 0; --i) {
        const {parser, inputStart} = stack[i];
        node = {
          parser, inputStart,
          input: trace.searchText,
          delegates: [node],
          traces: []
        };
      }
    } else {
      node = {
        parser: trace.parser,
        input: trace.searchText,
        inputStart: trace.inputStart,
        traces: [trace],
        delegates: [],
      };
    }

    return node;
  }

  function sortTreeNodes(a: DelegationTreeNode, b: DelegationTreeNode): number {
    if (a.parser !== b.parser) {
      return a.parser.toString().localeCompare(b.parser.toString());
    }
    return b.inputStart - a.inputStart;
  }

  function mergeBranch(node: DelegationTreeNode, branches: DelegationTreeNode[]) {
    let found = false;
    for (const branch of branches) {
      if (node.parser === branch.parser &&
          node.input === branch.input &&
          node.inputStart === branch.inputStart) {
        found = true;
        if (node.traces.length) {
          branch.traces.push(...node.traces);
        } else {
          for (const delegate of node.delegates) {
            mergeBranch(delegate, branch.delegates);
          }
        }
      }
    }
    if (!found) {
      branches.push(node);
      branches.sort(sortTreeNodes);
    }
  }

  export class SearchParserTracer {
    private delegatingParsers_: SearchParser[] = [];
    private traces_: ParseTrace[] = [];

    registerDelegatingParser(delegatingParser: DelegatingParser) {
      this.delegatingParsers_.push(delegatingParser);
    }

    clear() {
      this.traces_ = [];
    }

    record(trace: ParseTrace) {
      this.traces_.push(trace);
    }

    logToConsole(searchText: string) {
      if (LOG_RAW_TRACES) {
        console.log('\n v=v=v=v=v=v=v=v====== SearchParserTracer: Raw Traces =======v=v=v=v=v=v=v=v');
        console.log(`For search text '${searchText}'`);
        this.logRawTraces_();
      }

      console.log('\n v=v=v=v=v=v=v=v===== SearchParserTracer: Sorted Traces =======v=v=v=v=v=v=v=v');
      if (!LOG_RAW_TRACES) {
        console.log(`For search text '${searchText}'`);
      }
      this.logSortedTraces_();
    }

    private logSortedTraces_() {
      // Sort the traces by parser and delegation.
      const tree: DelegationTreeNode[] = [];

      for (const trace of this.traces_) {
        if (this.delegatingParsers_.indexOf(trace.parser) === -1) {
          mergeBranch(buildTreeNodePath(trace), tree);
        }
      }

      for (const branch of tree) {
        this.logBranchToConsole_(branch, '');
      }
      console.log(' ^-^-^-^------------ End SearchParserTracer.logToConsole() ------------^-^-^-^');
    }

    private logRawTraces_() {
      for (const trace of this.traces_) {
        let parserDescription;
        if (trace.delegationInfo) {
          const stack = trace.delegationInfo.delegationStack;
          const delegate = stack[stack.length - 1].parser;
          const delegators = stack.slice(0, -1).map((stackItem) => stackItem.parser).join(', ');
          parserDescription = `${delegate} (via delegation: ${delegators})`;
        } else {
          parserDescription = trace.parser.toString();
        }

        const prevInput = trace.prevParse ? trace.prevParse.input : '';
        const newInput = trace.searchText;
        let inputDescription =
            `'${prevInput.slice(trace.inputStart)}' => '${newInput.slice(trace.inputStart)}'`;
        if (trace.inputStart > 0) {
          inputDescription += ` (part of '${trace.searchText}')`;
        }
        console.log(`${parserDescription}: ${inputDescription}`);
        if (trace.outputs && trace.outputs.length) {
          for (const parse of trace.outputs) {
            console.log(STANDARD_INDENT + this.parseDescription_(parse));
          }
        } else if (trace.error) {
          logError_(STANDARD_INDENT, trace.error);
        } else {
          console.log(STANDARD_INDENT + '// No output parses.');
        }
      }
    }

    private logBranchToConsole_(branch: DelegationTreeNode, indent: string) {
      const inputSlice = branch.input.slice(branch.inputStart);
      if (branch.traces.length > 0) {
        const trace0 = branch.traces[0];
        const prevText = trace0.prevParse ? trace0.prevParse.input : '';

        console.log(`${indent}${branch.parser}: '${prevText}' => '${inputSlice}'`);
        const parseIndent = indent + STANDARD_INDENT;
        for (const trace of branch.traces) {
          if (trace.outputs) {
            for (const parse of trace.outputs) {
              console.log(parseIndent + this.parseDescription_(parse), parse);
            }
          }
          if (trace.error) {
            logError_(parseIndent, trace.error);
          }
        }
      }
      if (branch.delegates.length > 0) {
        console.log(`${indent}${branch.parser}: DELEGATES for '${branch.input.slice(branch.inputStart)}':`);
        for (const subbranch of branch.delegates) {
          this.logBranchToConsole_(subbranch, indent + STANDARD_INDENT);
        }
      }
      if (branch.traces.length === 0 && branch.delegates.length === 0) {
        console.log(`${indent}${branch.parser}: NO OUTPUT for '${inputSlice}'`);
      }
    }

    private parseDescription_(parse: PendingParse) {
      const isDelegate = this.delegatingParsers_.indexOf(parse.parser) !== -1;
      const isNewDelegate = isDelegate && parse.inputStart === parse.inputEnd &&
          (parse as DelegatingParse).delegatePendingParse === undefined;

      const parser = isDelegate ?
          (parse as DelegatingParse).delegationStack.slice(-1)[0].parser : parse.parser;
      const parserDescription =
          isNewDelegate ? 'New delegation to ' +  parser :
          isDelegate ? 'Delegation to ' + parser :
          parser;
      const expr = parse.getExpression();
      const valueType = expr ? expr.getValueType() : undefined;
      const ofValueType = valueType ? `of ${valueType} ` : '';
      const hasExpr = isNewDelegate ? '' :
          (expr ? `${expr.type.name} ${ofValueType}` : 'NO Expression! ');
      const withSnippet = isNewDelegate ? '' :
          (parse.getSnippet() ? 'withSnippet ' : '');
      const mayContine = parse.mayContinue ? 'mayContinue ' : 'done.';

      return `${parserDescription}: ${hasExpr}${withSnippet}${mayContine}`;
    }
  }
}

function logError_(parseIndent: string, error: Error) {
  const errorStr = error.stack || error.toString();
  const errorLines = errorStr.split('\n').map((line) => parseIndent + line);
  console.warn(errorLines.join('\n'));
}
