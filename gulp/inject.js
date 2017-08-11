const gulp = require('gulp');
const plumber = require('gulp-plumber');
const inject = require('gulp-inject');
const naturalSort = require('gulp-natural-sort');
const angularFilesort = require('gulp-angular-filesort');
const bowerFiles = require('main-bower-files');
const npmFiles = require('./npm-files');
const handleErrors = require('./handle-errors');
const config = require('./config');

module.exports = {
  app: app,
  css: css,
  vendor: vendor,
  test: test,
  troubleshoot: troubleshoot
};

function app() {
  return gulp.src(config.app + 'index.html')
    .pipe(inject(gulp.src(config.app + 'app/**/*.js')
      .pipe(plumber({ errorHandler: handleErrors }))
      .pipe(naturalSort())
      .pipe(angularFilesort()), { relative: true }))
    .pipe(gulp.dest(config.app));
}

function css() {
  return gulp.src(config.app + 'index.html')
    .pipe(inject(gulp.src(config.app + 'content/css/**/*.css', { read: false })
      .pipe(plumber({ errorHandler: handleErrors }))
      .pipe(naturalSort()), { relative: true }))
    .pipe(gulp.dest(config.app));
}

function vendor() {
  const stream = gulp.src(config.app + 'index.html')
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(inject(gulp.src(bowerFiles(), { read: false }), {
      name: 'bower',
      relative: true
    }))
    .pipe(inject(gulp.src(npmFiles(), { read: false }), {
      name: 'npm',
      relative: true
    }))
    .pipe(gulp.dest(config.app));

  return stream;
}

function test() {
  return gulp.src(config.test + 'karma.conf.js')
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(inject(gulp.src(bowerFiles({ includeDev: true, filter: ['**/*.js'] }), { read: false }), {
      starttag: '// bower:js',
      endtag: '// endbower',
      transform: function (filepath) {
        return '\'' + filepath.substring(1, filepath.length) + '\',';
      }
    }))
    .pipe(gulp.dest(config.test));
}

function troubleshoot() {
  /* this task removes the troubleshooting content from index.html*/
  return gulp.src(config.app + 'index.html')
    .pipe(plumber({ errorHandler: handleErrors }))
    /* having empty src as we dont have to read any files*/
    .pipe(inject(gulp.src('', { read: false }), {
      starttag: '<!-- inject:troubleshoot -->',
      removeTags: true,
      transform: function () {
        return '<!-- Angular views -->';
      }
    }))
    .pipe(gulp.dest(config.app));
}
