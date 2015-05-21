'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:KevScriptCtrl
 * @description
 * # KevScriptCtrl
 * Controller of the editorApp kevscript editor page
 */
angular.module('editorApp')
    .controller('KevScriptCtrl', function ($scope, $modal, $timeout, $state, kEditor, kScript, saveFile) {
        $scope.kevscript = '';
        $scope.processing = false;

        $scope.editorOptions = {
            lineWrapping: true,
            lineNumbers: true,
            mode: 'kevscript',
            styleActiveLine: true,
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Ctrl-S': function () {
                    $modal
                        .open({
                            templateUrl: 'scripts/app/kevscript/kevscript.modal.html',
                            size: 'sm',
                            scope: $scope,
                            controller: function ($scope, $modalInstance) {
                                $scope.filename = new Date().getTime();
                                $modalInstance.opened.then(function () {
                                    $timeout(function () {
                                        angular.element('#filename').focus();
                                    }, 100);
                                });

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
            },
            theme: 'kevscript'
        };

        var editor = null;
        $scope.editorLoaded = function (_editor) {
            editor = _editor;
            editor.setValue(kScript.parseModel(kEditor.getModel()));
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
                // TODO
                kScript.parse($scope.kevscript, kEditor.getModel(), function (err, model) {
                    if (err) {
                        console.log('KevScript parse error:', err.message);
                        $scope.parseError = err.message;
                        $scope.processing = false;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }

                    } else {
                        kEditor.setModel(model);
                        $state.go('main');
                    }
                });
            }
        };
    });