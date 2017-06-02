// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-04-16 using
// generator-karma 0.9.0

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // bower:js
      'src/bower_components/angular/angular.js',
      'src/bower_components/angular-animate/angular-animate.js',
      'src/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'src/bower_components/jquery/dist/jquery.js',
      'src/bower_components/angular-hotkeys/build/hotkeys.js',
      'src/bower_components/angular-touch/angular-touch.js',
      'src/bower_components/codemirror/lib/codemirror.js',
      'src/bower_components/angular-ui-codemirror/ui-codemirror.js',
      'src/bower_components/angular-ui-router/release/angular-ui-router.js',
      'src/bower_components/angular-ui-notification/dist/angular-ui-notification.js',
      'src/bower_components/kevoree-library/browser/kevoree-library.js',
      'src/bower_components/kevoree-validator/browser/kevoree-validator.js',
      'src/bower_components/tiny-conf/dist/tiny-conf.js',
      'src/bower_components/kevoree-registry-client/build/browser/kevoree-registry-client.js',
      'src/bower_components/kevoree-kevscript/browser/kevoree-kevscript.js',
      'src/bower_components/snap.svg/dist/snap.svg-min.js',
      'src/bower_components/snap.svg.zpd/snap.svg.zpd.js',
      'src/bower_components/highlightjs/highlight.pack.js',
      'src/bower_components/angular-highlightjs/build/angular-highlightjs.js',
      'src/bower_components/ngInfiniteScroll/build/ng-infinite-scroll.js',
      'src/bower_components/mustache.js/mustache.js',
      'src/bower_components/angular-mocks/angular-mocks.js',
      'src/bower_components/jquery-ui/jquery-ui.js',
      'src/bower_components/angular-dragdrop/src/angular-dragdrop.js',
      // endbower
      'app/scripts/**/*.js',
      'test/mock/**/*.js',
      'test/spec/**/*.js'
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'PhantomJS'
    ],

    // Which plugins to enable
    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine'
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
