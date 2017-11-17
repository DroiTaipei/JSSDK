var gulp = require("gulp");
var ts = require("gulp-typescript");

gulp.task("node", function () {
  var tsProject = ts.createProject("tsconfig.node.json");
  return tsProject.src()  
  .pipe(tsProject())
  .js.pipe(gulp.dest("node_local"));
});

gulp.task("copy-html", function () {
  var paths = {
    pages: ['src/*.html']
};

return gulp.src(paths.pages)
      .pipe(gulp.dest("wwwroot"));
});

var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');

gulp.task("www", ["copy-html"], function () {
  return browserify({
      basedir: '.',
      debug: true,
      entries: ['src/test/main.ts'],
      cache: {},
      packageCache: {}
  })
  .plugin(tsify, { p:"tsconfig.www.json" })
  .bundle()
  .pipe(source('bundle.js'))  // gives streaming vinyl file object
  .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
  .pipe(uglify()) // now gulp-uglify works 
  .pipe(gulp.dest("wwwroot"));
});


