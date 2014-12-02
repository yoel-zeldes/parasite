/**
 * This file/module contains all configuration for the build process.
 */

var join = require('path').join;
    
function getFiles(relativeToBower, relativeToCurrentDir) {
    return relativeToBower.map(function(path) {
        return '../../src/parasite/www/external/bower_components/' + path;
    }).concat(relativeToCurrentDir).concat(['!../../src/**/build/**']);
}
var js = getFiles([
    'jquery/jquery.min.js',
    'angular/angular.js',
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
],
[
    '../../src/parasite/www/external/class/class.js',
    '../../src/parasite/www/!(external)/**/module.js',
    '../../src/parasite/www/!(external)/**/*.js',
]);

var css = getFiles([
    'select2/select2.css',
    'select2/select2-bootstrap.css',
    'bootstrap/docs/assets/css/bootstrap.css',
    'kendo-ui/styles/web/kendo.common.core.min.css'
],
[
    '../../src/parasite/www/!(external)/**/*.css'
]);

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
        css: css,
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
