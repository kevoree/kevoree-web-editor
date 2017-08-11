const gulp = require('gulp');
const browserSync = require('browser-sync');
const config = require('./config');

module.exports = function serve() {
  browserSync({
    open: true,
    port: config.port,
    server: {
      baseDir: config.app,
    }
  });

  gulp.start('watch');
};
