'use strict';

angular.module('editorApp')
  .run(function (kScript, kEditor) {
    var tokens = ['repoToken', 'includeToken', 'addToken', 'removeToken', 'moveToken',
      'setToken', 'attachToken', 'detachToken', 'networkToken', 'bindToken',
      'unbindToken', 'namespaceToken', 'startToken', 'stopToken',
      'pauseToken', 'comment'];

    function findLine(pos, lines) {
      var line = -1;
      for (var i = 0; i < lines.length; i++) {
        if ((pos[0] >= lines[i].start) && (pos[1] <= lines[i].end)) {
          line = lines[i].line;
          break;
        }
      }
      return line;
    }

    function relativeToLine(ch, lines) {
      var val = 0;
      for (var i = 0; i < lines.length; i++) {
        var tmp = val + (lines[i].end - lines[i].start) + 1; // + 1 is for \n
        if (tmp > ch) {
          return ch - val;
        } else {
          val = tmp;
        }
      }
      return ch - val;
    }

    CodeMirror.registerHelper('lint', 'kevscript', function (ctxVars) {
      return function (text, updateLinting, options, cm) {
        CodeMirror.signal(cm, 'lintStart');
        var start = 0;
        var lines = text.split('\n').map(function (line, i) {
          var obj = {
            start: start,
            end: start + line.length,
            line: i
          };
          start += line.length + 1;
          return obj;
        });

        kScript.parse(text, kEditor.getModel(), ctxVars, function (err, model, warnings) {
          var error;
          var lintErrors = [];
          if (err) {
            if (err.nt) {
              var message = 'Unable to match \'' + err.nt + '\'';
              if (err.nt === 'ws') {
                message = 'Unable to match \'whitespace\'';
              } else if (err.nt === 'kevScript') {
                message = 'A line must start with a statement (add, attach, set, etc.)';
              } else if (tokens.indexOf(err.nt) >= 0) {
                message = 'Expected statement or comment (do you mean \'' + (err.nt.split('Token').shift()) + '\'?)';
              }
              lintErrors.push({
                severity: 'error',
                message: message,
                from: CodeMirror.Pos(err.line - 1, (err.col === 0) ? 0 : err.col - 1),
                to: CodeMirror.Pos(err.line - 1, (err.col === 0) ? 1 : err.col)
              });
            } else {
              if (err.pos) {
                var line = findLine(err.pos, lines);
                lintErrors.push({
                  severity: 'error',
                  message: err.message,
                  from: CodeMirror.Pos(line, relativeToLine(err.pos[0], lines)),
                  to: CodeMirror.Pos(line, relativeToLine(err.pos[1], lines))
                });
              } else {
                error = err;
              }
            }
          } else {
            options.lintedModel = model;
          }

          warnings.forEach(function (warning) {
            var line = findLine(warning.pos, lines);
            lintErrors.push({
              severity: 'warning',
              message: warning.message,
              from: CodeMirror.Pos(line, relativeToLine(warning.pos[0], lines)),
              to: CodeMirror.Pos(line, relativeToLine(warning.pos[1], lines))
            });
          });

          CodeMirror.signal(cm, 'lintDone', error, lintErrors, model);
          updateLinting(cm, lintErrors);
        });
      };
    });
  });
