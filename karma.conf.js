// Karma configuration
// Generated on Mon Jun 30 2014 14:41:08 GMT+0300 (IDT)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
	'jquery/jquery.min.js',
        'angular/angular.js',
        'angular-mocks/angular-mocks.js',
        'angular-resource/angular-resource.js',
        'angular-animate/angular-animate.js',
	'select2/select2.js',
	'angular-ui-select2/src/select2.js',
	'd3/d3.js',
	'd3-tip/index.js',
	'kendo-ui/js/kendo.ui.core.min.js',
	'angular-kendo/angular-kendo.js',
	'bootstrap/docs/assets/js/bootstrap.min.js',
	'angular-bootstrap/ui-bootstrap.js'
    ].map(function(path) {
        return './src/parasite/www/external/bower_components/' + path;
    }).concat([
	'./tests/bind.shim.js',
	'./src/parasite/www/external/class/class.js',
	'./src/parasite/www/!(external)/**/module.js',
        './prod_mode.js',
	'./src/parasite/www/core/**/*.js',
	'./src/parasite/www/applications/utils/**/*.js',
	'./src/parasite/www/!(external)/**/*.js',

        './tests/**/*.js'
    ]),


    // list of files to exclude
    exclude: [
        './src/**/dev_services.js',
        './src/**/build/**/*.js'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    plugins: [
        'karma-jasmine',
//        'karma-chrome-launcher',
        'karma-phantomjs-launcher'
    ]
  });


  process.env['PHANTOMJS_BIN'] = process.env['PHANTOMJS_BIN'] || 'phantomjs';
};
