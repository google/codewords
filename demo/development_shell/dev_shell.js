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

window.addEventListener('load', function() {
  // Constants
  const ES6 = CodeWordsJS.ES6;
  const editor = CodeWords.inject(document.getElementById('codewords'));
  window.devshell = editor; // Global reference for inspection in the console.
  editor.setSnippetSuggestFns([
    CodeWordsJS.suggestLiteralNumber,
    CodeWordsJS.suggestLiteralString,
    CodeWordsJS.suggestConsoleFn
  ]);

  // AST for the following example code:
  //   loadScene("ground")
  //   new Block().position = xy(0, -300)
  let fallingBlocks = ES6.newExpression('DOCUMENT', {
    children: [
        ES6.functionCall(ES6.identifier('loadScene'),
            ES6.stringLiteral('ground')),

        ES6.newExpression('OP_ASSIGNMENT', {
          children: {
            left: ES6.memberRef(
                ES6.newOperator('Block'),
                ES6.newExpression('IDENTIFIER', 'position')),
            right:
                ES6.functionCall(ES6.identifier('xy'),
                    ES6.numberLiteral(0),
                    ES6.numberLiteral(-300))
          }
        })
    ]
  });

  // TODO: Example code "ballInBetween"
  //   loadScene("ground")
  //   new Block().position = xy(-150, -300)
  //   new Block().position = xy(150, -400)
  //   new Ball().position = xy(100, -600)

  editor.setDocument(fallingBlocks);
});
