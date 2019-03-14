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

/// <reference path="../../../codewords_core/build/codewords_core.d.ts" />
/// <reference path="../expression/js_expression_types.ts" />
/// <reference path="../snippet/statement_snippet.ts" />

namespace CodeWordsJS {
  import Expression = CodeWords.AST.Expression;
  import Snippet = CodeWords.Snippet.Snippet;
  import SnippetContext = CodeWords.Snippet.SnippetContext;
  import JavaScriptCode = CodeWordsJS.JavaScriptCode;
  import StatementSnippet = CodeWordsJS.Snippet.StatementSnippet;

  import JsValueType = CodeWordsJS.Value.JsValueType;
  import JsValueTypeFlags = CodeWordsJS.Value.JsValueTypeFlags;

  // The following is not a recommended way to do things.  This is just a quick
  // and dirty way to get more snippet options in the devshell.

  // Start matching 'console' at 'co'
  const CONSOLE_PATTERN = '[cC]' + hackyStringCompletion('onsole') + '.?';
  const REGEX_CONSOLE = new RegExp(`^${CONSOLE_PATTERN}$`);
  const REGEX_LOG = new RegExp(`^(?:${CONSOLE_PATTERN}\s*)?`
      + hackyStringCompletion('log') + '(?:[ (](.*))?');
  const REGEX_PRINT = new RegExp(`^[Pp]${hackyStringCompletion('rint')}(?:[ (](.*))?`);
  const REGEX_INFO = new RegExp(`^(?:${CONSOLE_PATTERN}\s*)?`
      + hackyStringCompletion('info') + '(?:[ (](.*))?');
  const REGEX_WARN = new RegExp(`^(?:${CONSOLE_PATTERN}\s*)?`
      + hackyStringCompletion('warn') + '(?:[ (](.*))?');
  const REGEX_ERROR = new RegExp(`^(?:${CONSOLE_PATTERN}\s*)?`
      + hackyStringCompletion('error') + '(?:[ (](.*))?');
  const REGEX_ASSERT = new RegExp(`^(?:${CONSOLE_PATTERN}\s*)?`
      + hackyStringCompletion('assert') + '(?:[ (](.*))?');
  const REGEX_TABLE = new RegExp(`^(?:${CONSOLE_PATTERN}\s*)?`
      + hackyStringCompletion('table') + '(?:[ (]l(.*))?');
  // TODO: Fix Regexes to fail match if partial match is not immediately followed by word break.

  const HACKY_FN_TYPE_SPEC = new JsValueType(JsValueTypeFlags.FUNCTION, {
    functionSpec: {
      returnType: TYPE_VOID,
      args: [TYPE_STRING],
      autocompletions: []
    }
  });

  /**
   * Suggest a console function if the user types console or the function name.
   * @param context The snippet search context
   * @return The suggested snippets for the context.
   */
  export function suggestConsoleFn(context: SnippetContext): Snippet[] {
    const lang = context.astDoc!.language as JavaScriptCode;
    const text = context.searchText.trim();
    const canonical = text.toLocaleLowerCase();
    const results: Snippet[] = [];

    const consoleNs = lang.identifier('console',
        new JsValueType(JsValueTypeFlags.NAMESPACE, {devName: 'console'}));

    const all = REGEX_CONSOLE.test(text);

    let match =
        (all ? [] : REGEX_LOG.exec(canonical) || REGEX_PRINT.exec(canonical)) as RegExpExecArray;
    if (match) {
      if (all || match[1] || (match[0] && text.toLowerCase() === match[0].toLowerCase())) {
        const mesg = match[1] ? text.slice(match[0].indexOf(match[1])) : 'Message';
        results.push(createConsoleSnippet(lang, consoleNs, 'log', mesg));
      }
    }

    match = (all ? [] : REGEX_INFO.exec(canonical))  as RegExpExecArray;
    if (match) {
      const mesg = match[1] ? text.slice(match[0].indexOf(match[1])) : 'Info';
      results.push(createConsoleSnippet(lang, consoleNs, 'info', mesg));
    }

    match = (all ? [] : REGEX_WARN.exec(canonical)) as RegExpExecArray;
    if (match) {
      const mesg = match[1] ? text.slice(match[0].indexOf(match[1])) : 'Warning!';
      results.push(createConsoleSnippet(lang, consoleNs, 'warn', mesg));
    }

    match = (all ? [] : REGEX_ERROR.exec(canonical)) as RegExpExecArray;
    if (match) {
      const mesg = match[1] ? text.slice(match[0].indexOf(match[1])) : 'Error!';
      results.push(createConsoleSnippet(lang, consoleNs, 'error', mesg));
    }

    // TODO: console.assert(..): Where does the condition come from?
    // TODO: console.table(..): Strings are useless here. Wait for objs and array.

    return results;
  }

  function createConsoleSnippet(lang: JavaScriptCode,
                                consoleId: IdentifierExpression,
                                fnName: string,
                                message: string)
  : Snippet {
    const logCommand = createConsoleExpression(
        lang, consoleId, fnName, lang.stringLiteral(message));
    // TODO: Adjust priority based on match likelihood
    return new StatementSnippet(logCommand);
  }

  function createConsoleExpression(lang: JavaScriptCode,
                                   consoleId: IdentifierExpression,
                                   fnName: string,
                                   ...params: Expression[]) {
    return lang.functionCall(
        lang.memberRef(consoleId, lang.identifier(fnName, HACKY_FN_TYPE_SPEC)),
        {params});
  }

  function hackyStringCompletion(match: string): string {
    let result = '';
    for (let i = match.length - 1; i >= 0; --i) {
      const char = match[i];
      console.log(`[\${char.toLowerCase()}\${char.toUpperCase()}] = [${char.toLowerCase()}${char.toUpperCase()}]`);
      result = result? `[${char.toLowerCase()}${char.toUpperCase()}](?:${result})?` : char;
    }
    console.log(`result = ${result}`);
    return result;
  }
}
