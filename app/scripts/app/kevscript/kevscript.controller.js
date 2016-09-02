'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:KevScriptCtrl
 * @description
 * # KevScriptCtrl
 * Controller of the editorApp kevscript editor page
 */
angular.module('editorApp')
  .controller('KevScriptCtrl', function($scope, $modal, $timeout, $state, kEditor, kScript, saveFile, storage, Notification, AUTOLOAD_KEVS) {
    var editor = null;

    function saveToFile() {
      $modal
        .open({
          templateUrl: 'scripts/components/util/filename.modal.html',
          size: 'sm',
          scope: $scope,
          controller: function($scope, $modalInstance) {
            $scope.title = 'Save Kevscript';
            $scope.body = 'Would you like to save your current KevScript to a file?';
            $scope.filename = 'model' + (Math.floor(Math.random() * (1000 - 100)) + 100);

            $scope.save = function() {
              function endsWith(str, suffix) {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
              }
              var suffix = '.kevs';
              if (endsWith($scope.filename, suffix)) {
                $scope.filename = $scope.filename.substr(0, $scope.filename.length - '.kevs'.length);
              }
              saveFile.save($scope.kevscript, $scope.filename, suffix, 'kevscript');
              $modalInstance.close();
            };
          }
        })
        .result.finally(function() {
          if (editor) {
            editor.focus();
          }
        });
    }

    function updateEditor() {
      if (storage.get(AUTOLOAD_KEVS, true) && editor) {
        try {
          var modelStr = kScript.parseModel(kEditor.getModel());
          editor.setValue(modelStr);
        } catch (err) {
          console.warn('[kevscript.controller.editorLoaded()] Error creating Kevscript from model');
          console.error(err.stack);
          Notification.error({
            startTop: 65,
            title: 'KevScript parser',
            message: 'Unable to convert current model to KevScript',
            delay: 5000
          });
        }
      }
    }

    $scope.kevscript = '';
    $scope.processing = false;
    $scope.message = null;
    $scope.ctxVars = {};
    $scope.lintErrors = null;
    $scope.lintWarnings = null;
    $scope.linting = false;
    $scope.editorOptions = {
      mode: 'kevscript',
      theme: 'kevscript',
      lineWrapping: true,
      lineNumbers: true,
      styleActiveLine: true,
      extraKeys: {
        'Tab': false,
        'Ctrl-Space': 'autocomplete',
        'Ctrl-S': saveToFile
      },
      gutters: ['CodeMirror-lint-markers'],
      lint: {
        getAnnotations: CodeMirror.lint.kevscript($scope.ctxVars),
        async: true,
        model: kEditor.getModel()
      }
    };

    $scope.editorLoaded = function(_editor) {
      editor = _editor;
      editor.on('lintStart', function () {
        $timeout(function () {
          $scope.linting = true;
          $scope.lintErrors = $scope.lintWarnings = [];
        });
      });
      editor.on('lintDone', function (error, lintErrors, model) {
        $timeout(function () {
          $scope.model = model;
          $scope.error = error || lintErrors.filter(function (err) { return err.severity === 'error'; })[0];
          $scope.lintWarnings = lintErrors
            .filter(function (error) {
              return error.severity === 'warning';
            });
          $scope.linting = false;
        });
      });
      updateEditor();
      editor.focus();
      CodeMirror.signal(editor, 'change', editor);
    };

    $scope.uploadKevscript = function() {
      var kevscriptUpload = angular.element('#kevscript-upload');
      kevscriptUpload.on('change', function(event) {
        var reader = new FileReader();
        reader.onloadend = function() {
          $scope.kevscript = editor.setValue(reader.result);
        };
        reader.readAsBinaryString(event.target.files[0]);
      });
      kevscriptUpload.trigger('click');
    };

    $scope.closeMessage = function() {
      $scope.message = null;
    };

    $scope.isMergeable = function () {
      return !$scope.processing &&
             $scope.kevscript.trim().length > 0 &&
             $scope.lintErrors &&
             $scope.lintErrors.length === 0;
    };

    $scope.clearCtxVars = function () {
      Object.keys($scope.ctxVars).forEach(function (key) {
        delete $scope.ctxVars[key];
      });
      CodeMirror.signal(editor, 'change', editor);
    };

    $scope.addCtxVar = function (ctxVar) {
      if (ctxVar.key && ctxVar.value) {
        $scope.ctxVars[ctxVar.key] = ctxVar.value;
        ctxVar.key = '';
        ctxVar.value = '';
        CodeMirror.signal(editor, 'change', editor);
      }
    };

    $scope.removeCtxVar = function (key) {
      delete $scope.ctxVars[key];
      CodeMirror.signal(editor, 'change', editor);
    };

    $scope.merge = function() {
      if (!$scope.processing) {
        $scope.processing = true;
        $timeout(function () {
          kEditor.setModel($scope.model, function () {
            $scope.processing = false;
          });
        });
      }
    };

    $scope.save = saveToFile;

    var unregister = kEditor.addNewModelListener('kevscript', updateEditor);
    $scope.$on('$destroy', function () {
      unregister();
    });
  });
