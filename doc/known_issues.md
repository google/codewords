# Known Issues

## Search parsing with the IdentifierSearchParser

### Critical:

 * No longer performs function/constructor autocompletion.
 * Delegation from NewOperatorSearchParser and FunctionCallSearchParser.
 * Traverse . dot operator

### Later:
 * Options to control emitting class, function identifier Snippets.
 * Identify <constructor>.<property> expressions and create postfix snippets.

## Touch mode drag shadow is obscured by user's finger.

The 'precise' mode of drag leaves the finger in the way on touch. The
drag shadow should be offset from the pointer touch area such that the
first line of text is fully above the finger area. This requires
offsetting the hit boxes used to test placement.

Can probably hack this with alternative invisible test boxes. These
would have to updated after animation finishes.

This is critical for on-the-go demos that I have been doing. It would
greatly improve the validity of a user test.

## Other Missing Features

 * **Cannot render block expressions and indentation.** Theoretically
   the APIs exist, but this has not been tested. Need to add some
   JavaScript loops/conditions/functions to test.
 * **Drop area is small, limited.** Experiment with hiding the snippet
   drawer during a drag.
 * **Incomplete JavaScript.** The currently implemented set of
   JavaScript is exactly the set needed to render the document in the
   development shell.
 * **Snippets and Snippet Search.** Very few snippets available.
 * **Need selection and deletion.** Only insertion and replacement are
   currently supported.
 * **Tap behaviors.**
   * Tap to select. This should also potentially trigger a "cut" button
     and peek the documentation, if any are associated with the
     expression.
   * Tap to copy expression into the snippet palette.
   * Tap to trigger custom editors.
   * Tap repeatedly to grow the selection.
 * **Android and iOS library to host in a webview.** In addition to
   hosting the HTML & JavaScript library, these should help manage focus
   and screen size as the on-screen keyboard opens and closes, and
   provide hooks to native drag behaviors.
 * **Code selection.** In order to support cut, copy, and maybe move,
   the user needs to be able to select a span of code.
 * **Intelligent line wrapping.** Code layout is unaware of available
   space. Relies on HTML's default word wrap behavior. The view needs to
   calculate character size from font configuration.
 * **Configurable color highlighting.** Syntax highlighting is unmanaged
   by the editor, and handled exclusively via CSS. The style should be
   managed by the editor, to support changing the color scheme, and more
   importantly facilitate canvas drawn drag shadows.
 * **Parsing.** There is no parser for loading in a JavaScript document,
   nor any other way to save and load a document. Awaiting the APIs to
   stabilize.

## Drop target locations

All drop targets are expanded before the dragged snippet is near. This
was a quick and dirty solution that allowed me to use the target div as
a hit box.

FULL_LINE targets should only expand and highlight as the snippet gets
near. Compare with this jQuery UI list demo:
https://jqueryui.com/sortable/

INLINE targets should group together, making a larger target within
which the components can be sorted with horizontal motion. This reduces
the space required by the line. This should also be paired with the
ability to swap out the text on the draggable entity.

In both cases, it should be able to pre-calculate the hit boxes,
offsetting them by distance between the left edge of the first line of
the drag shadow (itself, possibly offset) to the pointer event location.

## Overscroll indicator

The current results on Android are ugly and out of place.  See these
links:
 * https://stackoverflow.com/q/39277258/152543
 * https://bugs.chromium.org/p/chromium/issues/detail?id=365804

Possible solution:
 * Via JavaScript: http://derekknox.com/articles/material-design-overscroll-in-vanilla-js/
 * Via very very new CSS property: https://developers.google.com/web/updates/2017/11/overscroll-behavior

## Build System

`build_js.py` currently runs two instances of `tsc`, where the output of
one is the input of the other. This can confuse the system, and
sometimes the two processes stabilize in a false negative compiler
error.

Considering implementing a Gulp build system when I can encode the
dependencies between the libraries.  This could also simplify the
integration of other build steps (e.g., copying the built files into
other directories; triggering the android or iOS builds).

## Breaks on older browsers (Android API 21 or less)

### TypeScript for loop shim for Iterables is broken.

https://github.com/Microsoft/TypeScript/issues/20394

Need to replace `__values(..)` function in each generated `.js` with the
following code:

```ts
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    if (o instanceof Array) {
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }
    // .next() of the Iterable protocol
    return (typeof o.next === "function") ? o : {done: true};
};
```

May require switching build system to Gulp (or similar) to add a
post-compile step that works with a `--watch` mode.

This will make the generator functions of typescript_in_webview pass on
Android 16 through 21.

Relatedly, investigate [`tslib`](https://github.com/Microsoft/tslib),
`--importHelpers` and `--noEmitHelpers`.

## Code Cleanup

 * Replace Object.freeze(X) as X with actual immutable class
   declarations. The extra declarations will make it clear to the IDE
   and to the call site when a variable is mutable. Probably needs
   custom freeze operations to handle deep traversal.
 * Before I figured out an appropriate usage pattern for import, I used
   partial namespaces. Replace all those with full package imports.
