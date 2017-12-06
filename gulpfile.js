const gulp = require("gulp");
const ts = require("gulp-typescript");
const rename = require("gulp-rename");
const fs = require('fs');
const bump = require('gulp-bump');
const semver = require('semver');
const process = require('process');
const browserify = require("browserify");
const source = require('vinyl-source-stream');
const tsify = require("tsify");
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const runSequence = require('run-sequence')

function packBrowserify(destName) {
  return browserify({
    basedir: '.',
//      debug: true,
    entries: ['./index.browser.ts'],
    cache: {},
    packageCache: {},
    standalone: "DroiBaaS"
  })
  .plugin(tsify, { p:"tsconfig.www.json" })
  .bundle()
  .pipe(source(destName))  // gives streaming vinyl file object
  .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
  // .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(uglify()) // now gulp-uglify works
  // .pipe(sourcemaps.write('.')) 
  .pipe(gulp.dest("release"));
}

function copyPlatform(platform) {
  return gulp.src([`platforms/${platform}/src/**/*.ts`, `platforms/${platform}/src/**/*.js`])
    .pipe(gulp.dest('src'));
}

// Sub Tasks
gulp.task("copy-tests", function() {
  return gulp.src('test/**')
    .pipe(gulp.dest('release/tests'));
});

gulp.task("copy-www", function() {
  return gulp.src('server.js')
    .pipe(gulp.dest('release'))
});

gulp.task("copy-package", ['bump'], function() {
  gulp.src('package.release.json')
    .pipe(rename('package.json'))
    .pipe(gulp.dest('release'));

  return gulp.src(['README.md', 'CHANGELOG.md'])
    .pipe(gulp.dest('release'))
});

gulp.task('bump', function () {
  if (process.env.DISABLE_BUMP) {
    console.log('- Disable version bumping.');
    return;
  }
    
  // reget package
  var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  // increment version
  var newVer = semver.inc(pkg.version, 'patch');

  // uses gulp-filter
  gulp.src('./package.json')
    .pipe(bump({
      version: newVer
    }))
    .pipe(gulp.dest('./'));

  gulp.src('./package.release.json')
    .pipe(bump({
      version: newVer
    }))
    .pipe(gulp.dest('./'));

  return gulp.src('./src/droi-core.ts')
    .pipe(bump({
      version: newVer
    }))
    .pipe(gulp.dest('./src'));
});

gulp.task("node-build", ['copy-package', 'copy-tests', 'platform-general'], function() {
  var tsProject = ts.createProject("tsconfig.node.json");
  
  return tsProject.src()  
  .pipe(tsProject())
  .js.pipe(gulp.dest("release/src"));
})

gulp.task("copy-html", function () {
  return gulp.src(['test/browser/*.html', 'test/browser/*.js', 'node_modules/mocha/mocha.*'])
      .pipe(gulp.dest("wwwroot"));
});

gulp.task("platform-weapp", function () {
  return copyPlatform('weapp');
});

gulp.task('platform-general', function() {
  return copyPlatform('general');
});

gulp.task("patch-weapp", function () {
  let data = fs.readFileSync("release/droi-baas-weapp-min.js").toString();
  data = data.replace('h.XMLHttpRequest', 'XMLHttpRequest');
  fs.writeFileSync("release/droi-baas-weapp-min.js", data);
});

gulp.task("www-weapp", function () {
  return packBrowserify('droi-baas-weapp-min.js');
});

// Main tasks
gulp.task("node", ['node-build'], function () {
  return gulp.src("release/src/droi-secure/src/*.js")
    .pipe(uglify())
    .pipe(gulp.dest("release/src/droi-secure/src"));
});

gulp.task("www", ['copy-www', 'platform-general'], function () {
  return packBrowserify('droi-baas-min.js');
});

gulp.task("weapp", function () {
  return runSequence('platform-weapp', 'www-weapp', 'patch-weapp');
})

// Release task
gulp.task("release", function () {
  return runSequence('node', 'www', 'weapp');
})