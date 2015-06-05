'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the editorApp main content div
 */
angular.module('editorApp')
    .controller('MainCtrl', function ($scope, $timeout, $modal, kEditor, hotkeys, saveFile, uiFactory, kModelHelper, kFactory, Notification) {
        Notification.config({ top: 90 });

        $scope.onFileLoaded = function () {};

        $scope.open = function (evt) {
            evt.preventDefault();

            $scope.onFileLoaded = function (data) {
                $scope.loading = true;
                var oldModel = kEditor.getModel();
                try {
                    var loader = kFactory.createJSONLoader();
                    var model = loader.loadModelFromString(data).get(0);
                    kEditor.setModel(model);
                } catch (err) {
                    console.warn('[main.controller.open()] Error loading model file');
                    console.error(err.stack);
                    Notification.error({
                        title: 'Open from file',
                        message: 'Unable to load your model',
                        delay: 5000
                    });
                    kEditor.setModel(oldModel);
                } finally {
                    $scope.loading = false;
                }
            };
            angular.element('input#file').click();
        };

        $scope.dndLoad = function (data) {
            var oldModel = kEditor.getModel();
            try {
                $scope.loading = true;
                var loader = kFactory.createJSONLoader();
                var model = loader.loadModelFromString(data).get(0);
                kEditor.setModel(model);
            } catch (err) {
                console.warn('[main.controller.dndLoad()] Error loading model file');
                console.error(err.stack);
                Notification.error({
                    title: 'Open from file (dnd)',
                    message: 'Unable to load your model',
                    delay: 5000
                });
                kEditor.setModel(oldModel);
            } finally {
                $scope.loading = false;
            }
        };

        $scope.merge = function (evt) {
            evt.preventDefault();
            $scope.onFileLoaded = function mergeModel(data) {
                try {
                    $scope.loading = true;
                    var loader = kFactory.createJSONLoader();
                    var compare = kFactory.createModelCompare();
                    var model = loader.loadModelFromString(data).get(0);
                    compare.merge(model, kEditor.getModel()).applyOn(model);
                    kEditor.setModel(model);
                } catch (err) {
                    console.warn('[main.controller.merge()] Error loading model file');
                    console.error(err.stack);
                    Notification.error({
                        title: 'Merge from file',
                        message: 'Unable to merge your model',
                        delay: 5000
                    });
                } finally {
                    $scope.loading = false;
                }
            };
            angular.element('input#file').click();
        };

        $scope.openFromNode = function (evt) {
            evt.preventDefault();
            console.log('openFromNode');
            Notification.warning({
                title: 'Open from node',
                message: 'Not implemented yet',
                delay: 3000
            });
        };

        $scope.mergeFromNode = function (evt) {
            evt.preventDefault();
            console.log('mergeFromNode');
            Notification.warning({
                title: 'Merge from node',
                message: 'Not implemented yet',
                delay: 3000
            });
        };

        $scope.save = function (evt, filename) {
            evt.preventDefault();
            var serializer = kFactory.createJSONSerializer();

            try {
                // serialize model
                var modelStr = serializer.serialize(kEditor.getModel());
                // prettify model
                modelStr = JSON.stringify(JSON.parse(modelStr), null, 4);
                // download model on client
                saveFile.save(modelStr, filename, '.json', 'application/json');
            } catch (err) {
                Notification.error({
                    title: 'Save',
                    message: 'Unable to serialize model to JSON',
                    delay: 5000
                });
            }
        };

        $scope.deleteAll = function (evt) {
            evt.preventDefault();
            $scope.deleteInstances(evt);
            kEditor.getModel().removeAllPackages();
        };

        $scope.deleteInstances = function (evt) {
            evt.preventDefault();
            var model = kEditor.getModel();
            model.removeAllNodes();
            model.removeAllGroups();
            model.removeAllHubs();
            model.removeAllMBindings();
        };

        $scope.deleteSelected = function (evt) {
            evt.preventDefault();
            var deletions = uiFactory.deleteSelected();
            if (deletions === 0) {
                Notification.warning({
                    title: 'Delete selected',
                    message: 'Nothing selected',
                    delay: 3000
                });
            }
        };

        //$scope.undo = function (evt) {
        //    evt.preventDefault();
        //    console.log('undo');
        //    Notification.warning({
        //        title: 'Undo',
        //        message: 'Not implemented yet',
        //        delay: 3000
        //    });
        //};
        //$scope.redo = function (evt) {
        //    evt.preventDefault();
        //    console.log('redo');
        //    Notification.warning({
        //        title: 'Redo',
        //        message: 'Not implemented yet',
        //        delay: 3000
        //    });
        //};

        hotkeys.add({
            combo: 'ctrl+o',
            description: 'Open a model from a file',
            callback: $scope.open
        });

        hotkeys.add({
            combo: 'ctrl+m',
            description: 'Merge a model from a file with current model in editor',
            callback: $scope.merge
        });

        hotkeys.add({
            combo: 'ctrl+shift+o',
            description: 'Open a model from a node',
            callback: $scope.openFromNode
        });

        hotkeys.add({
            combo: 'ctrl+shift+m',
            description: 'Merge a model from a node with current model in editor',
            callback: $scope.mergeFromNode
        });

        hotkeys.add({
            combo: 'ctrl+s',
            description: 'Save the current model into a JSON file',
            callback: function (evt) {
                evt.preventDefault();
                var saveFile = $scope.save;
                $modal
                    .open({
                        templateUrl: 'scripts/components/util/filename.modal.html',
                        size: 'sm',
                        controller: function ($scope, $modalInstance) {
                            $scope.title = 'Save model';
                            $scope.body = 'Would you like to save your current model to a file?';
                            $scope.filename = 'model'+(Math.floor(Math.random() * (1000 - 100)) + 100);
                            $modalInstance.opened.then(function () {
                                $timeout(function () {
                                    angular.element('#filename').focus();
                                }, 100);
                            });

                            $scope.save = function () {
                                function endsWith(str, suffix) {
                                    return str.indexOf(suffix, str.length - suffix.length) !== -1;
                                }
                                var suffix = '.json';
                                if (endsWith($scope.filename, suffix)) {
                                    $scope.filename = $scope.filename.substr(0, $scope.filename.length - suffix.length);
                                }
                                saveFile(evt, $scope.filename);
                                $modalInstance.close();
                            };
                        }
                    });
            }
        });

        hotkeys.add({
            combo: 'alt+shift+d',
            description: 'Delete everything in the current model',
            callback: $scope.deleteAll
        });

        hotkeys.add({
            combo: 'alt+shift+i',
            description: 'Delete instances in the current model',
            callback: $scope.deleteInstances
        });

        hotkeys.add({
            combo: 'del',
            description: 'Delete selected instances in the current model',
            callback: $scope.deleteSelected
        });

        //hotkeys.add({
        //    combo: 'ctrl+z',
        //    description: 'Undo the last modification',
        //    callback: $scope.undo
        //});
        //
        //hotkeys.add({
        //    combo: 'ctrl+y',
        //    description: 'Redo the last modification',
        //    callback: $scope.redo
        //});
    });
