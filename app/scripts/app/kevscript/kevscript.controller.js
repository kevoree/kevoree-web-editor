'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:KevScriptCtrl
 * @description
 * # KevScriptCtrl
 * Controller of the editorApp kevscript editor page
 */
angular.module('editorApp')
    .controller('KevScriptCtrl', function ($scope, $modal, $timeout, $state, kEditor, kScript) {
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
                                $modalInstance.opened.then(function () {
                                    $timeout(function () {
                                        angular.element('#filename').focus();
                                    }, 100);
                                });

                                var suffix = '.kevs';

                                $scope.save = function () {
                                    var kevsAsBlob = new Blob([$scope.kevscript], {type: 'kevscript'});
                                    var filename = $scope.filename;
                                    if (!filename || filename.length === 0) {
                                        filename = Date.now()+suffix;
                                    } else if (!endsWith(filename, suffix)) {
                                        filename = filename+suffix;
                                    }

                                    var downloadLink = document.createElement('a');
                                    downloadLink.download = filename;
                                    downloadLink.innerHTML = 'Download Kevoree KevScript';
                                    if (window.webkitURL !== null) {
                                        // Chrome allows the link to be clicked
                                        // without actually adding it to the DOM.
                                        downloadLink.href = window.webkitURL.createObjectURL(kevsAsBlob);
                                    } else {
                                        // Firefox requires the link to be added to the DOM
                                        // before it can be clicked.
                                        downloadLink.href = window.URL.createObjectURL(kevsAsBlob);
                                        downloadLink.onclick = function (e) {
                                            document.body.removeChild(e.target);
                                        };
                                        downloadLink.style.display = 'none';
                                        document.body.appendChild(downloadLink);
                                    }

                                    downloadLink.click();
                                    $modalInstance.close();
                                };

                                function endsWith(str, suffix) {
                                    return str.indexOf(suffix, str.length - suffix.length) !== -1;
                                }
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