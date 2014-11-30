var path = require('path');
var gulp = require('gulp');
var util = require('gulp-util');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var livereload = require('gulp-livereload');
var watch = require('gulp-watch');
var plumber = require('gulp-plumber');
var inject = require('gulp-inject');
var lazypipe = require('lazypipe');
var child_process = require('child_process');
var stream = require('event-stream');
var karma = require('gulp-karma');

// Load user config and package data
var cfg = require('./build.config.js');

/**
 * Compile and concat scripts, styles and templates. Invoked when running 'gulp' with no other arguments.
 * The task first clean the build folder (in gulp syntax, we say the 'default' task is depended on the 'clean' to run.
 */
gulp.task('default', ['prod']);

/**
 * Actual build task. Note that we hint gulp to first run clean (since we say that 'build' depend on it directly).
 */
gulp.task('_build', ['clean', 'build-styles', 'build-fonts', 'build-images']);
gulp.task('build-dev', ['_build', 'build-index-dev']);
gulp.task('prod', ['_build', 'build-index-prod']);

/**
 * A simple command which clean the build directory.
 */
gulp.task('clean', function () {
    return gulp.src([cfg.buildDir + '/**/*', 'compile/**/*'], {read: false})
        .pipe(clean({force: true}));
});

gulp.task('build-index-dev', ['clean', 'build-styles'], function () {
    return gulp.src(cfg.appFiles.index, {base: cfg.appFiles.index.substr(0, cfg.appFiles.index.lastIndexOf("/"))})
        .pipe(injectDependencies({dev: true}));
});

gulp.task('build-scripts-prod', ['clean'], function () {
    return gulp.src(cfg.appFiles.jsProd)
        .pipe(buildJs());
});

gulp.task('build-index-prod', ['build-scripts-prod', 'build-styles'], function() {
    return gulp.src(cfg.appFiles.index, {base: cfg.appFiles.index.substr(0, cfg.appFiles.index.lastIndexOf("/"))})
        .pipe(injectDependencies({dev: false}));
});

gulp.task('build-styles', ['clean'], function() {
    return gulp.src(cfg.appFiles.css)
        .pipe(buildCss());
});

gulp.task('build-images', ['clean'], function() {
    return gulp.src(cfg.appFiles.img)
        .pipe(gulp.dest(cfg.buildDir));
});

gulp.task('build-fonts', ['clean'], function() {
    return gulp.src(cfg.appFiles.fonts)
        .pipe(gulp.dest(cfg.buildDir));
});


/**
 * Watch all files and re-compile on change.
 */
gulp.task('dev', ['build-dev'], function () {
    // Setup watchers.
    // Most watchers must do a full 'compilation' when a change is detected (e.g, JavaScript must concat all files even
    // if only one is changed, Jade must recompile all files since a change to a template can affect other pages.)
    var livereloadServer = livereload(cfg.livereloadPort);

    watch({ glob: cfg.appFiles.js, emitOnGlob: false, name: 'JavaScript' }, function (files) {
        return gulp.src(cfg.appFiles.js)
            .pipe(buildJs())
            .pipe(livereload(cfg.livereloadPort));
    });

    watch({ glob: cfg.appFiles.css, emitOnGlob: false, name: 'Css' }, function (files) {
        return gulp.src(cfg.appFiles.css)
            .pipe(buildCss())
            .pipe(livereload(cfg.livereloadPort));
    });

    watch({ glob: cfg.appFiles.html, emitOnGlob: false, name: 'Html' }, function (files) {
        return gulp.src(cfg.appFiles.html)
            .pipe(livereload(cfg.livereloadPort));
    });

    watch({ glob: cfg.appFiles.js.concat([cfg.buildDir + 'parasite.css', cfg.appFiles.index]), emitOnGlob: false, name: 'injectables' }, function (files) {
        return gulp.src(cfg.appFiles.index, {base: cfg.appFiles.index.substr(0, cfg.appFiles.index.lastIndexOf("/"))})
            .pipe(injectDependencies({dev: true}))
            .pipe(livereload(cfg.livereloadPort));
    });
});

gulp.task('dev-server', ['dev'], function () {
    // Create the server so it will start listening.
    var parasiteServer = null;
    function resetParasite() {
        if (parasiteServer != null) {
            parasiteServer.kill();
        }
        parasiteServer = child_process.exec('python2.7 ../../src/parasite.wsgi');
    }

    process.on('SIGINT', function() {
        if (parasiteServer != null) {
            parasiteServer.kill();
        }
        process.exit();
    });
    resetParasite();

    watch({ glob: cfg.appFiles.py, emitOnGlob: false, name: 'Python' }, function (files) {
        resetParasite();
    });
});

/**
 * Run tests using karama.
 */
gulp.task('test', function () {
    // undefined.js: unfortunately necessary for now. the source files will be defined in karma.config.js.
    return gulp.src(['undefined.js'])
        .pipe(karma({
            configFile: cfg.testFiles.config,
            // available actions: run - for running once, watch - run the tests every time a change occurs in
            // one of the test / tested files.
            action: 'run'
        }))
        .on('error', function(err) {
            // Make sure failed tests cause gulp to exit non-zero
            throw err;
        });
});

/**
 * Run tests using karama after building.
 */
gulp.task('test-dev', ['build-dev', 'test']);

/**
 * Concat js code to a single js file (and not vendor code).
 */
function buildJs() {
    // Lazy pipe can be attached to an existing pipe (e.g, gulp.src(..,).pipe(jsPipe))
    var jsPipe = lazypipe()
        // Plumber take care of errors in the pipe (ignore them and print them to the log). Allows watching file and not
        // 'crashing' when a file cannot be complied.
        .pipe(plumber, { errorHandler: util.log })
        .pipe(concat, 'parasite.js')
//        .pipe(uglify)
        .pipe(gulp.dest, cfg.buildDir);

    return jsPipe();
}

/**
 * Concat all css files to a single file.
 */
function buildCss() {
    var stylesPipe = lazypipe()
        .pipe(plumber, { errorHandler: util.log })
        .pipe(concat, 'parasite.css')
        .pipe(gulp.dest, cfg.buildDir);

    return stylesPipe();
};

/**
 * Inject all js files into the given html file using gulp-inject.
 */
function injectDependencies(options) {
    var js = options.dev ? gulp.src(cfg.appFiles.js, {read : false}) : gulp.src(cfg.buildDir + 'parasite.js', {read : false});
    var css = options.dev ? gulp.src(cfg.appFiles.css, {read : false}) : gulp.src(cfg.buildDir + "parasite.css", {read : false});

    var jsPipe = lazypipe()
        .pipe(plumber, { errorHandler: util.log })
        .pipe(inject, stream.merge(js, css), {transform: function(filepath, file, index, length) {
            filepath = filepath.substr(filepath.indexOf('/www'));
            switch(path.extname(filepath).slice(1)) {
                case 'css':
                    return '<link rel="stylesheet" href="' + filepath + '">';
                case 'js':
                    return '<script src="' + filepath + '"></script>';
                case 'html':
                    return '<link rel="import" href="' + filepath + '">';
                case 'coffee':
                    return '<script type="text/coffeescript" src="' + filepath + '"></script>';
            }
        }})
        .pipe(gulp.dest, cfg.buildDir);

    if (options.dev) {
        jsPipe = jsPipe
            // Add the development mode files to the injection section:
            .pipe(inject, gulp.src(cfg.appFiles.jsDevMode, {read : false}), {starttag: '<!-- inject:dev:{{ext}} -->', transform: function(filepath, file, index, length) {
                filepath = cfg.buildDir.substr(cfg.buildDir.indexOf('/www')) + path.basename(filepath);

                return '<script src="' + filepath + '"></script>';
            }})
            .pipe(gulp.dest, cfg.buildDir)
            // And don't forget to copy them to the build directory (this is needed because they're not under the www folder, so we won't have access to them from flask):
            .pipe(gulp.src, cfg.appFiles.jsDevMode)
            .pipe(gulp.dest, cfg.buildDir)
    }

    return jsPipe();
}