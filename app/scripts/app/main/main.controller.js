'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the editorApp main content div
 */
angular.module('editorApp')
    .controller('MainCtrl', function ($scope, kEditor, hotkeys, saveFile, uiFactory, kModelHelper, kFactory, Notification) {
        Notification.config({ top: 90 });

        $scope.open = function (evt) {
            evt.preventDefault();
            angular.element('input#file').click();
            $scope.onFileLoaded = function (data) {
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
                }
            };
        };

        $scope.dndLoad = function (data) {
            try {
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
            }
        };

        $scope.merge = function (evt) {
            evt.preventDefault();
            angular.element('input#file').click();
            $scope.onFileLoaded = function (data) {
                try {
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
                }
            };
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

        $scope.save = function (evt) {
            evt.preventDefault();
            var serializer = kFactory.createJSONSerializer();

            try {
                // serialize model
                var modelStr = serializer.serialize(kEditor.getModel());
                // prettify model
                modelStr = JSON.stringify(JSON.parse(modelStr), null, 2);
                // download model on client
                saveFile.save(modelStr, null, '.json', 'application/json');
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
            console.log('deleteAll');
            Notification.warning({
                title: 'Delete all',
                message: 'Not implemented yet',
                delay: 3000
            });
        };

        $scope.deleteInstances = function (evt) {
            evt.preventDefault();
            console.log('deleteInstances');
            Notification.warning({
                title: 'Delete instances',
                message: 'Not implemented yet',
                delay: 3000
            });
        };

        $scope.deleteSelected = function (evt) {
            evt.preventDefault();
            var model = kEditor.getModel();
            uiFactory.getSelected().forEach(function (path) {
                console.log('TO DELETE', path);
                var elem = model.findByPath(path);
                if (elem) {
                    elem.delete();
                }
            });
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
            callback: $scope.save
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
