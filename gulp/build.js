const fs = require('fs');
const gulp = require('gulp');
const lazypipe = require('lazypipe');
const footer = require('gulp-footer');
const sourcemaps = require('gulp-sourcemaps');
const rev = require('gulp-rev');
const htmlmin = require('gulp-htmlmin');
const ngAnnotate = require('gulp-ng-annotate');
const prefix = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const useref = require('gulp-useref');
const revReplace = require('gulp-rev-replace');
const plumber = require('gulp-plumber');
const gulpIf = require('gulp-if');
const handleErrors = require('./handle-errors');

const config = require('./config');

const initTask = lazypipe()
  .pipe(sourcemaps.init);
const jsTask = lazypipe()
  .pipe(ngAnnotate)
  .pipe(uglify);
const cssTask = lazypipe()
  .pipe(prefix)
  .pipe(cssnano);

module.exports = () => {
  const templates = fs.readFileSync(config.tmp + 'templates.js');
  const manifest = gulp.src(config.revManifest);

  return gulp.src([config.app + '**/*.html',
    '!' + config.app + 'app/**/*.html',
    '!' + config.bower + '**/*.html'])
    .pipe(plumber({ errorHandler: handleErrors }))
    //init sourcemaps and prepend semicolon
    .pipe(useref({}, initTask))
    //append html templates
    .pipe(gulpIf('**/app.js', footer(templates)))
    .pipe(gulpIf('*.js', jsTask()))
    .pipe(gulpIf('*.css', cssTask()))
    .pipe(gulpIf('*.html', htmlmin({ collapseWhitespace: true })))
    .pipe(gulpIf('**/*.!(html)', rev()))
    .pipe(revReplace({ manifest: manifest }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.dist));
};
