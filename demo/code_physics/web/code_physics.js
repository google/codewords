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

const MIN_CODE_WORDS_HEIGHT = 300;

window.addEventListener('load', function() {
  // Constants
  const cwEditor = CodeWords.inject(document.getElementById('codewords'));
  window.cwEditor = cwEditor; // Global reference for inspection in the console.

  initUI(cwEditor);

  const globalScope = new CodeWordsJS.Value.JsScope();
  const apiObjectTypes = {};

  buildSimplePhysicsApi(globalScope, apiObjectTypes);
  initCodewordsEditor(cwEditor, globalScope);
  loadFallingBlocks(cwEditor, globalScope, apiObjectTypes);


  // Examples for testing:
  // SimplePhysics.run('loadScene("ground"); new Block(80, 80).position = xy(0, -900)');
});

function initUI(cwEditor) {
  // Calculate sizes
  let desiredAspectRatio = 4/3;
  let minCodeWordsHeight = Math.min(MIN_CODE_WORDS_HEIGHT, window.innerHeight / 2);
  // Aspect Ratio that maximizes the simulation view.
  let minAspectRatio = (window.innerWidth / (window.innerHeight - minCodeWordsHeight));
  let aspectRatio = minAspectRatio > desiredAspectRatio ? minAspectRatio : desiredAspectRatio;

  let canvas = document.getElementById('physics-canvas');
  let pixelWidth = Math.round(window.innerWidth * window.devicePixelRatio);
  let pixelHeight = Math.round(pixelWidth / aspectRatio);
  canvas.setAttribute('width', pixelWidth);
  canvas.setAttribute('height', pixelHeight);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = (window.innerWidth /aspectRatio) + 'px';

  const top = document.getElementById('top');
  const topHeightStr = getComputedStyle(top).height;

  const buttonRun = document.getElementById('button-run');
  const buttonEdit = document.getElementById('button-edit');
  const drawer = document.getElementsByClassName('cw-drawer')[0];
  const overlay = document.getElementById('editor-touch-detect-overlay');

  let timeoutId;

  function onPlay() {
    console.log('onPlay()');
    overlay.classList.remove('hidden');
    drawer.classList.add('hidden');
    buttonRun.classList.add('hidden');
    buttonEdit.classList.remove('hidden');

    top.style.top = '0px';
    bottom.style.top = topHeightStr;

    // Delay start until UI transition animation is complete
    timeoutId = setTimeout(() => {
      const code = cwEditor.getCodeString();
      console.log('code:\n' + code);
      SimplePhysics.run(code);
    }, 400);
  }
  function onEdit() {
    clearTimeout(timeoutId);
    SimplePhysics.stop();

    console.log('onEdit()');
    overlay.classList.add('hidden');
    drawer.classList.remove('hidden');
    buttonRun.classList.remove('hidden');
    buttonEdit.classList.add('hidden');

    top.style.top = '-' + topHeightStr;
    bottom.style.top = '0px';

    document.getElementsByClassName('cw-input')[0].focus();
  }
  buttonRun.onclick = onPlay;
  buttonEdit.onclick = onEdit;
  overlay.onclick = onEdit;

  onPlay();
}

function buildSimplePhysicsApi(global, objectTypes) {
  const ES6 = CodeWordsJS.ES6;
  const JsValueType = CodeWordsJS.Value.JsValueType;
  const JsValueTypeFlags = CodeWordsJS.Value.JsValueTypeFlags;
  const JsScope = CodeWordsJS.Value.JsScope;

  const CONSTRUCTOR = JsValueTypeFlags.CONSTRUCTOR;
  const FUNCTION = JsValueTypeFlags.FUNCTION;
  const NAMESPACE = JsValueTypeFlags.NAMESPACE;
  const OBJECT = JsValueTypeFlags.OBJECT;

  const TYPE_STRING = CodeWordsJS.TYPE_STRING;
  const TYPE_NUMBER = CodeWordsJS.TYPE_NUMBER;
  const TYPE_VOID = CodeWordsJS.TYPE_VOID;

  const objTypes = {};

  // Math
  const mathNS = new JsScope();
  mathNS.addMember('random', new JsValueType(FUNCTION, {
    devName: 'Math.random',
    functionSpec: {
      returnType: TYPE_NUMBER,
      args: [],
      autocompletions: [
        {
          args: [],
          score: 1000
        }
      ]
    }
  }));
  global.addMember('Math', new JsValueType(NAMESPACE, {
    devName: 'Math',
    memberScope: mathNS
  }));

  // loadScene(string)
  global.addMember('loadScene', new JsValueType(FUNCTION, {
    devName: 'loadScene',
    functionSpec: {
      returnType: TYPE_VOID,
      args: [TYPE_STRING],
      autocompletions: [
        {
          args: [ES6.stringLiteral('ground')],
          score: 1000
        }
      ]
    }
  }));

  // xy objects
  objTypes['xy'] = new JsValueType(OBJECT, {
    devName: 'xy',
    memberScope: new JsScope()
  });
  objTypes['xy'].memberScope.addMember('x', TYPE_NUMBER);
  objTypes['xy'].memberScope.addMember('y', TYPE_NUMBER);
  // xy object factory function
  global.addMember('xy', new JsValueType(FUNCTION, {
    devName: 'xy',
    functionSpec: {
      args: [TYPE_NUMBER, TYPE_NUMBER],
      returnType: objTypes['xy'],
      autocompletions: [
        {
          args: [ES6.numberLiteral(0), ES6.numberLiteral(0)],
          score: 1000
        }
      ]
    }
  }));

  // Shapes
  shapeClass = new JsScope();
  shapeClass.addMember('position', objTypes['xy']);

  function addShape(name) {
    objTypes[name] = new JsValueType(OBJECT, {
      devName: name,
      memberScope: new JsScope(shapeClass)
    });
    global.addMember(name, new JsValueType(CONSTRUCTOR, {
      devName: name,
      functionSpec: {
        args: [],
        returnType: objTypes[name],
        autocompletions: [
          {
            args: [],
            score: 9999
          }
        ]
      }
    }));
  }
  addShape('Ball');
  addShape('Block');
  addShape('Circle');
  addShape('Rectangle');

  return objTypes;
}

function initCodewordsEditor(cwEditor) {
  cwEditor.setSnippetSuggestFns([
    CodeWords.Search.asSnippetSuggestFn([
      new CodeWordsJS.Search.CallParametersParser(),
      new CodeWordsJS.Search.IdentifierSearchParser(),
      new CodeWordsJS.Search.NewObjectSearchParser(),
      new CodeWordsJS.Search.NumberLiteralParser(),
      new CodeWordsJS.Search.StringLiteralParser()
    ]),
    CodeWordsJS.suggestConsoleFn
  ]);

  cwEditor.addExpressionClickHandlers(CodeWordsJS.UI.COPY_ON_CLICK_HANDLERS);
}

function loadFallingBlocks(cwEditor, global, objectTypes) {
  const ES6 = CodeWordsJS.ES6;

  const xyType = objectTypes['xy'];
  const BlockConstructor = global.getMember('Block').valueType;

  // AST for the following example code:
  //   loadScene("ground")
  //   new Block().position = xy(0, -600)
  let fallingBlocks = ES6.newExpression('DOCUMENT', {
    containerScope: new CodeWordsJS.Value.JsScope(global),
    children: [
      ES6.functionCall(ES6.identifier('loadScene'), {
        params: [
            ES6.stringLiteral('ground')
        ],
        returnType: CodeWordsJS.TYPE_VOID
      }),

      ES6.newExpression('OP_ASSIGNMENT', {
        children: {
          left: ES6.memberRef(
              ES6.newOperatorForClassname('Block', BlockConstructor),
              ES6.identifier('position', xyType)),
          right:
              ES6.functionCall(ES6.identifier('xy'), {
                params: [
                  ES6.numberLiteral(0),
                  ES6.numberLiteral(-600)
                ]
              })
        }
      })
    ]
  });

  cwEditor.setDocument(fallingBlocks);
}

// TODO: function loadBallInBetween() for code:
//   loadScene("ground")
//   new Block().position = xy(-150, -300)
//   new Block().position = xy(150, -400)
//   new Ball().position = xy(100, -600)

