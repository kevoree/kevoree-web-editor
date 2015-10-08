'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:KevScriptCtrl
 * @description
 * # KevScriptCtrl
 * Controller of the editorApp kevscript editor page
 */
angular.module('editorApp')
    .controller('KevScriptCtrl', function ($scope, $modal, $timeout, $state, kEditor, kScript, saveFile, Notification) {
        function saveToFile() {
            $modal
                .open({
                    templateUrl: 'scripts/components/util/filename.modal.html',
                    size: 'sm',
                    scope: $scope,
                    controller: function ($scope, $modalInstance) {
                        $scope.title = 'Save Kevscript';
                        $scope.body = 'Would you like to save your current KevScript to a file?';
                        $scope.filename = 'model'+(Math.floor(Math.random() * (1000 - 100)) + 100);

                        $scope.save = function () {
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
                .result.finally(function () {
                    if (editor) {
                        editor.focus();
                    }
                });
        }

        $scope.kevscript = '';
        $scope.processing = false;

        $scope.editorOptions = {
            lineWrapping: true,
            lineNumbers: true,
            mode: 'kevscript',
            styleActiveLine: true,
            extraKeys: {
                'Tab': false,
                'Ctrl-Space': 'autocomplete',
                'Ctrl-S': saveToFile
            },
            theme: 'kevscript'
        };

        var editor = null;
        $scope.editorLoaded = function (_editor) {
            editor = _editor;
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
            editor.focus();
        };

        $scope.uploadKevscript = function () {
            var kevscriptUpload = angular.element('#kevscript-upload');
            kevscriptUpload.on('change', function (event) {
                var reader = new FileReader();
                reader.onloadend = function () {
                    $scope.kevscript = editor.setValue(reader.result);
                };
                reader.readAsBinaryString(event.target.files[0]);
            });
            kevscriptUpload.trigger('click');
        };

        $scope.closeParseError = function () {
            $scope.parseError = null;
        };

        $scope.closeRuntimeError = function () {
            $scope.runtimeError = null;
        };

        $scope.merge = function () {
            if (!$scope.processing) {
                $scope.processing = true;
                kScript.parse($scope.kevscript, kEditor.getModel(), function (err, model) {
                    if (err) {
                        console.log('KevScript parse error:', err.message);
                        $scope.parseError = err.message;
                        $scope.processing = false;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }

                    } else {
                        $state.go('main').then(function () {
                            kEditor.setModel(model);
                        });
                    }
                });
            }
        };

        $scope.save = saveToFile;
    });
