const gulp = require('gulp');
const { join } = require('path');
const rev = require('gulp-rev');
const plumber = require('gulp-plumber');
const es = require('event-stream');
const flatten = require('gulp-flatten');
const bowerFiles = require('main-bower-files');
const changed = require('gulp-changed');
const handleErrors = require('./handle-errors');
const config = require('./config');
const pkg = require('../package.json');

module.exports = {
  fonts: fonts,
  common: common,
  images: images,
  npm: npm
};

function fonts() {
  return es.merge(
    // bootstrap and font-awesome font-face path is: ../fonts
    gulp.src([config.bower + 'bootstrap/fonts/*.*', config.bower + 'components-font-awesome/fonts/*.*'])
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist + 'content/fonts/'))
    .pipe(rev())
    .pipe(gulp.dest(config.dist + 'content/fonts/'))
    .pipe(rev.manifest(config.revManifest, {
      base: config.dist,
      merge: true
    }))
    .pipe(gulp.dest(config.dist)),
    // devicon font-face path is: fonts
    gulp.src(config.bower + 'devicon/fonts/*.*')
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist + 'content/css/fonts/'))
    .pipe(rev())
    .pipe(gulp.dest(config.dist + 'content/css/fonts/'))
    .pipe(rev.manifest(config.revManifest, {
      base: config.dist,
      merge: true
    }))
    .pipe(gulp.dest(config.dist)),
    gulp.src(config.app + 'content/fonts/*.{woff,woff2,svg,ttf,eot,otf}')
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist + 'content/fonts/'))
    .pipe(flatten())
    .pipe(rev())
    .pipe(gulp.dest(config.dist + 'content/fonts/'))
    .pipe(rev.manifest(config.revManifest, {
      base: config.dist,
      merge: true
    }))
    .pipe(gulp.dest(config.dist))
  );
}

function common() {
  return gulp.src([config.app + 'robots.txt', config.app + 'favicon.ico', config.app + '.htaccess', config.app + 'CNAME'], { dot: true })
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist))
    .pipe(gulp.dest(config.dist));
}

function npm() {
  return es.merge(Object.keys(pkg.browserModules)
    .map((name) => {
      return gulp.src([].concat(pkg.browserModules[name]).map((target) => {
        return join(config.node_modules, name, target);
      }))
        .pipe(plumber({ errorHandler: handleErrors }))
        .pipe(changed(config.npm + name + '/'))
        .pipe(gulp.dest(config.npm + name + '/'));
    }));
}

function images() {
  return gulp.src(bowerFiles({ filter: ['**/*.{gif,jpg,png}'] }), { base: config.bower })
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist + 'bower_components'))
    .pipe(gulp.dest(config.dist + 'bower_components'));
}
