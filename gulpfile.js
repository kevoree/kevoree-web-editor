/* eslint-env node */
'use strict';

var gulp = require('gulp'),
  rev = require('gulp-rev'),
  templateCache = require('gulp-angular-templatecache'),
  htmlmin = require('gulp-htmlmin'),
  imagemin = require('gulp-imagemin'),
  ngConstant = require('gulp-ng-constant'),
  rename = require('gulp-rename'),
  eslint = require('gulp-eslint'),
  del = require('del'),
  runSequence = require('run-sequence'),
  browserSync = require('browser-sync'),
  plumber = require('gulp-plumber'),
  changed = require('gulp-changed'),
  gulpIf = require('gulp-if');

var handleErrors = require('./gulp/handle-errors'),
  serve = require('./gulp/serve'),
  util = require('./gulp/utils'),
  copy = require('./gulp/copy'),
  inject = require('./gulp/inject'),
  build = require('./gulp/build');

var config = require('./gulp/config');

gulp.task('clean', function () {
  return del([config.dist], { dot: true });
});

gulp.task('copy', ['copy:fonts', 'copy:common']);

gulp.task('copy:fonts', copy.fonts);

gulp.task('copy:common', copy.common);

gulp.task('copy:images', copy.images);

gulp.task('images', function () {
  return gulp.src(config.app + 'content/images/**')
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(changed(config.dist + 'content/images'))
    .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
    .pipe(rev())
    .pipe(gulp.dest(config.dist + 'content/images'))
    .pipe(rev.manifest(config.revManifest, {
      base: config.dist,
      merge: true
    }))
    .pipe(gulp.dest(config.dist))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('styles', [], function () {
  return gulp.src(config.app + 'content/css/**')
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('inject', function () {
  runSequence('inject:dep', 'inject:app', 'inject:css');
});

gulp.task('inject:dep', ['inject:test', 'inject:vendor']);

gulp.task('inject:app', inject.app);

gulp.task('inject:css', inject.css);

gulp.task('inject:vendor', inject.vendor);

gulp.task('inject:test', inject.test);

gulp.task('inject:troubleshoot', inject.troubleshoot);

gulp.task('assets:prod', ['images', 'styles', 'html', 'copy:images'], build);

gulp.task('html', function () {
  return gulp.src(config.app + 'app/**/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(templateCache({
      module: 'editorApp',
      root: 'app/',
      moduleSystem: 'IIFE'
    }))
    .pipe(gulp.dest(config.tmp));
});

gulp.task('ngconstant:dev', function () {
  return ngConstant({
    name: 'editorApp',
    constants: {
      VERSION: util.parseVersion(),
      APP_NAME: 'Kevoree Web Editor',
      KWE_POSITION: 'kwe_position',
      KWE_FOLDED: 'kwe_folded',
      KWE_TAG: 'kwe_tag',
      KWE_SELECTED: 'kwe_selected',
      KEVOREE_REGISTRY_URL: process.env.KEVOREE_REGISTRY_URL || 'https://registry.kevoree.org'
    },
    template: config.constantTemplate,
    stream: true
  })
    .pipe(rename('app.constants.js'))
    .pipe(gulp.dest(config.app + 'app/'));
});

gulp.task('ngconstant:prod', function () {
  return ngConstant({
    name: 'editorApp',
    constants: {
      VERSION: util.parseVersion(),
      APP_NAME: 'Kevoree Web Editor',
      KWE_POSITION: 'kwe_position',
      KWE_FOLDED: 'kwe_folded',
      KWE_TAG: 'kwe_tag',
      KWE_SELECTED: 'kwe_selected',
      KEVOREE_REGISTRY_URL: process.env.KEVOREE_REGISTRY_URL || 'https://registry.kevoree.org'
    },
    template: config.constantTemplate,
    stream: true
  }).pipe(rename('app.constants.js'))
    .pipe(gulp.dest(config.app + 'app/'));
});

// check app for eslint errors
gulp.task('eslint', function () {
  return gulp.src(['gulpfile.js', config.app + 'app/**/*.js'])
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

// check app for eslint errors anf fix some of them
gulp.task('eslint:fix', function () {
  return gulp.src(config.app + 'app/**/*.js')
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(eslint({
      fix: true
    }))
    .pipe(eslint.format())
    .pipe(gulpIf(util.isLintFixed, gulp.dest(config.app + 'app')));
});

gulp.task('test', function () {
  console.log('TODO'); // eslint-disable-line
});

gulp.task('watch', function () {
  gulp.watch('bower.json', ['install']);
  gulp.watch(['gulpfile.js', 'package.json'], ['ngconstant:dev']);
  gulp.watch(config.app + 'content/css/**/*.css', ['styles', 'inject:css']);
  gulp.watch(config.app + 'content/images/**', ['images']);
  gulp.watch(config.app + 'app/**/*.js', ['inject:app']);
  gulp.watch([config.app + '*.html', config.app + 'app/**']).on('change', browserSync.reload);
});

gulp.task('install', function () {
  runSequence(['inject:dep', 'ngconstant:dev'], 'inject:app', 'inject:css', 'inject:troubleshoot');
});

gulp.task('serve', ['install'], serve);

gulp.task('b', build);

gulp.task('build', ['clean'], function (cb) {
  runSequence(['copy', 'inject:vendor', 'ngconstant:prod'], 'inject:app', 'inject:css', 'inject:troubleshoot', 'assets:prod', cb);
});

gulp.task('default', ['serve']);
