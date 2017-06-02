'use strict';

var gulp = require('gulp'),
  rev = require('gulp-rev'),
  plumber = require('gulp-plumber'),
  es = require('event-stream'),
  flatten = require('gulp-flatten'),
  bowerFiles = require('main-bower-files'),
  changed = require('gulp-changed');

var handleErrors = require('./handle-errors');
var config = require('./config');

module.exports = {
  fonts: fonts,
  common: common,
  images: images
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
  return gulp.src([config.app + 'robots.txt', config.app + 'favicon.ico', config.app + '.htaccess'], { dot: true })
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist))
    .pipe(gulp.dest(config.dist));
}

function images() {
  return gulp.src(bowerFiles({ filter: ['**/*.{gif,jpg,png}'] }), { base: config.bower })
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist + 'bower_components'))
    .pipe(gulp.dest(config.dist + 'bower_components'));
}
