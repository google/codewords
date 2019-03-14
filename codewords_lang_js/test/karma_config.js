// Karma configuration. See http://karma-runner.github.io/1.0/intro/configuration.html

module.exports = function(config) {
  config.set({

    // Base path that will be used to resolve all patterns (eg. files, exclude).
    basePath: '../',

    // Frameworks to use.
    // Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // List of files / patterns to load in the browser.
    files: [
      '../codewords_core/build/codewords_core.js',
      'build/codewords_lang_js.js',
      '../codewords_core/test/**/*.js',
      'test/**/*.js'
    ],

    // List of files to exclude.
    exclude: [
      '../codewords_core/test/karma_*.js',
      'test/karma_*.js'
    ],

    // Preprocess matching files before serving them to the browser.
    // Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    // Test results reporter to use.
    // Possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // Web server port.
    port: 9876,

    // Enable / disable colors in the output (reporters and logs).
    colors: true,

    // Level of logging.
    // Possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes.
    autoWatch: false,

    // Start these browsers.
    // Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode.
    // If true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level: How many browser should be started simultaneous.
    concurrency: Infinity
  })
}
