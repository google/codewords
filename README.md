# Code Words

Code Words is a prototype code editor for programming languages, designed for
use on phones. Code Words integrates text-based search (the "Words" of "Code
Words") with type-aware drag-and-drop code snippet placement.

Compared to [Google's Blockly](developers.google.com/blockly), Code Word's use
of on-screen keyboards for search gives users access to large
function/statement libraries in a fix amount of screen space. Like Blockly,
structured editing of the abstract syntax tree ensures the code us
syntactically correct. Finally, code is displayed in its textual form, helping
learners transition to traditional text-based coding.

While designed for mobile first, Code Words is written as a web library, for
use on both Android and iOS devices. It can be embedded in a mobile webpage,
or integrated into a native mobile application via a WebView.

# Repository Structure

 * **`codewords_core`:** The central library.
 * **`codewords_lang_js`:** A library that partially implementats JavaScript's
   statements and abstract syntax tree.
 * **`demo`:** A set of demonstration projects.
 * **`doc`:** Project documentation (severely lacking).
