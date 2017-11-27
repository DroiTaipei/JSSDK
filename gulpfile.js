var gulp = require("gulp");
var ts = require("gulp-typescript");
var rename = require("gulp-rename");

gulp.task("copy-package", function() {
  return gulp.src('package.release.json')
    .pipe(rename('package.json'))
    .pipe(gulp.dest('release'));
});

gulp.task("copy-tests", function() {
  return gulp.src('test/**')
    .pipe(gulp.dest('release/tests'));
});

gulp.task("copy-www-server", function() {
  return gulp.src('server.js')
    .pipe(gulp.dest('release'))
});

gulp.task("node", ['copy-package', 'copy-tests', 'copy-www-server'], function () {
  var tsProject = ts.createProject("tsconfig.node.json");
  return tsProject.src()  
  .pipe(tsProject())
  .js.pipe(gulp.dest("release/src"));
});

gulp.task("copy-html", function () {
  var paths = {
    pages: ['test/browser/*.html', 'test/browser/*.js', 'node_modules/mocha/mocha.*']
  };

  return gulp.src(paths.pages)
      .pipe(gulp.dest("wwwroot"));
});

var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');

gulp.task("www", function () {
  return browserify({
      basedir: '.',
      debug: true,
      entries: ['./index.browser.ts'],
      cache: {},
      packageCache: {}
  })
  .plugin(tsify, { p:"tsconfig.www.json" })
  .bundle()
  .pipe(source('droi-baas-min.js'))  // gives streaming vinyl file object
  .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
  .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(uglify()) // now gulp-uglify works
  .pipe(sourcemaps.write('.')) 
  .pipe(gulp.dest("release"));
});

