# `codewords_core.js`

This library contains the editor UI and central classes of the CodeWords
editor framework.

## Compiling to JavaScript

The first time:

    npm install

There after:

    npx tsc

The compiler can also recompile automatically in response to changes:

    npx tsc --watch

`codewords_core.js` will be written to the `build/` directory, along
with TypeScript `.d.ts` declaration files.

To compile all the TypeScript libraries in this repository, also see the
`build_js.py` script at the root of the repository:

    ./build_js.py

Or in continuous mode:

    ./build_js.py --watch

## Run tests

This project is configured to use
[Karma test runner](https://karma-runner.github.io/).
[Jasmine](https://jasmine.github.io/) `.spec.js` files are located in
the `test/` directory.

To run Karma once:

    npm test

To run it in watch mode:

    npx karma start test/karma_config.js

Karma will open up a Chrome browser window to http://localhost:9876/ to
execute the tests. If you need to debug these tests, open a tab to
http://localhost:9876/debug.html. In the sources view, right click in
the source tree to add the TypeScript `src/` directories. Loading these
should enable the generated source maps.

## Lint Checks

To lint using [`tslint`](https://palantir.github.io/tslint/), run:

    npm check

The Google's [`gts`](https://github.com/google/ts-style) linter is also
configured. The output is better, but this project violates a couple of
the Google Style Rules. Run using:

    npx gts check

You will see several errors regarding use of namespaces and references,
but other errors should be addressed.
