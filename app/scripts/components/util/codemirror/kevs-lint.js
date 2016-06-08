'use strict';

angular.module('editorApp')
  .run(function () {
    CodeMirror.registerHelper('lint', 'kevscript', function (text, conf, cm) {
      var lines = text.split('\n');
      return cm.getStateAfter().errors.map(function (error) {
        var line = lines.indexOf(error.str);
        return {
          to:       CodeMirror.Pos(line, error.column),
          from:     CodeMirror.Pos(line, error.column),
          message:  error.message,
          severity: error.severity || 'error'
        };
      });
    });
  });
