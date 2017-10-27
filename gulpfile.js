var gulp = require("gulp");
var ts = require("gulp-typescript");
var fs = require('fs');
var bump = require('gulp-bump');
var semver = require('semver');


var getPackageJson = function () {
    return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  };
  
// bump versions on package/bower/manifest
gulp.task('bump', function () {
    // reget package
    var pkg = getPackageJson();
    // increment version
    var newVer = semver.inc(pkg.version, 'patch');
   
    // uses gulp-filter
    gulp.src('./package.json')
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

gulp.task("default", function () {
    gulp.run('bump');
    var tsResult = gulp.src("src/*.ts")
        .pipe(ts({
              noImplicitAny: true,
              out: "output.js"
        }));
    return tsResult.js.pipe(gulp.dest("local"));
});
