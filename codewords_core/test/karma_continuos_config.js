// Karma configuration for continually watching file changes.
// See http://karma-runner.github.io/1.0/intro/configuration.html

let baseConfigFn = require('./karma_config.js');

module.exports = function(config) {
  baseConfigFn(config);
  config.set({
    // Test results reporter to use.
    // Possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],

    // Enable / disable watching file and executing tests whenever any file changes.
    autoWatch: true,

    // Continuous Integration mode.
    // If true, Karma captures browsers, runs the tests and exits
    singleRun: false,
  });
};
