/**
 * This file/module contains all configuration for the build process.
 */

var join = require('path').join;
    

var js = [
    '../../src/**/jquery.min.js',
    '../../src/**/angular.js',
    '../../src/**/kendo.web.min.js',
    '../../src/**/d3/*.js',
    '../../src/**/d3-tip/*.js',
    '../../src/**/external/**/*.js',
    '../../src/**/module.js',
    '../../src/**/*.js',
    '!../../src/**/build/**',
    '!../../src/**/angular-mocks.js'
];

module.exports = {
	/**
	 * This is a collection of file patterns that refer to our app code (the
	 * stuff in `src/`). These file paths are used in the configuration of
	 * build tasks. `js` is all project javascript, less tests. `ctpl` contains
	 * our reusable components' (`src/common`) template HTML files, while
	 * `atpl` contains the same, but for our app's code. `html` is just our
	 * main HTML file, `less` is our main stylesheet, and `unit` contains our
	 * app's unit tests.
	 */
	appFiles: {
        js: js,
        jsDevMode: ['../../dev_mode.js'],
        jsProd: js.concat([ // The reason jsProd extends js and jsDevMod isn't is because prod_mode.js is concatenated into parasite.js, while dev_mode.js isn't - and it has to be considered differently.
            '../../prod_mode.js',
            '!../../src/**/dev_services.js'
        ]),
        html: [
            '../../src/**/*.html',
            '!../../src/**/build/**'
        ],
        index: '../../src/parasite/www/homepage/index.html',
        css: [
            '../../src/**/*.css',
            '!../../src/**/build/**'
        ],
        fonts: [
            '../../src/parasite/www/external/fontawesome/**/fontawesome-webfont.woff',
            '../../src/parasite/www/external/fontawesome/**/fontawesome-webfont.ttf'
        ],
        img: [
            '../../src/parasite/www/external/select2-3.4.0/select2.png',
            '../../src/parasite/www/external/select2-3.4.0/select2-spinner.gif'
        ],
        py: '../../src/**/*.py'
    },
	
    buildDir : '../../src/parasite/www/build/',
    
    /**
     * This is a collection of files used during testing only.
     */
    testFiles: {
        config: '../../karma.conf.js'
    },

    livereloadPort: 8008
};
