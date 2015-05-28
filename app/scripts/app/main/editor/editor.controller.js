'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:EditorCtrl
 * @description
 * # EditorCtrl
 * Controller of the editorApp editor
 */
angular.module('editorApp')
    .controller('EditorCtrl', function ($scope, kEditor, uiFactory, kModelHelper, kFactory, KWE_POSITION) {
        $scope.dropDroppable = {
            onDrop: 'onDrop'
        };
        $scope.dropOptions = {
            accept: function (obj) {
                var pkgPath = obj[0].dataset.pkgPath;
                var tdefName = obj[0].innerHTML.trim();
                var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
                var tdef = kModelHelper.findBestVersion(tdefs.array);
                var type = kModelHelper.getTypeDefinitionType(tdef);
                // TODO
                //console.log('TODO accept for ', pkgPath, tdef, type);
                return true;
            }
        };

        /**
         * Adds a new instance to the model based on the dropped TypeDefinition
         * @param evt
         * @param obj
         */
        $scope.onDrop = function (evt, obj) {
            var pkgPath = obj.helper[0].dataset.pkgPath;
            var tdefName = obj.helper[0].innerHTML.trim();
            var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
            var tdef = kModelHelper.findBestVersion(tdefs.array);
            var type = kModelHelper.getTypeDefinitionType(tdef);
            var editor = uiFactory.getEditorContainer();

            function preProcess(instance) {
                instance.typeDefinition = tdef;
                instance.started = true;
                var pos = kFactory.createValue();
                pos.name = KWE_POSITION;
                pos.value = JSON.stringify({ x: evt.clientX - editor.offsetLeft, y: evt.clientY - editor.offsetTop });
                instance.addMetaData(pos);
            }

            var model = kEditor.getModel();
            var instance;
            switch (type) {
                case 'node':
                    instance = kFactory.createContainerNode();
                    instance.name = 'node'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    model.addNodes(instance);
                    break;

                case 'group':
                    instance = kFactory.createGroup();
                    instance.name = 'grp'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    model.addGroups(instance);
                    break;

                case 'component':
                    instance = kFactory.createComponentInstance();
                    instance.name = 'comp'+parseInt(Math.random()*1000);
                    instance.typeDefinition = tdef;
                    instance.started = true;
                    var path = uiFactory.getNodePathAtPoint(evt.clientX, evt.clientY);
                    if (path) {
                        var node = model.findByPath(path);
                        if (node) {
                            node.addComponents(instance);
                        }
                    }
                    break;

                case 'channel':
                    instance = kFactory.createChannel();
                    instance.name = 'chan'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    model.addHubs(instance);
                    break;
            }
        };

        // init the UI kFactory
        uiFactory.init();

        /**
         * Create svg UIs based on current kEditor.getModel()
         */
        function processModel() {
            var model = kEditor.getModel();

            model.groups.array.forEach(function (instance) {
                uiFactory.createGroup(instance);
            });
            model.hubs.array.forEach(function (instance) {
                uiFactory.createChannel(instance);
            });

            model.nodes.array
                .sort(function (a, b) {
                    return kModelHelper.getNodeTreeHeight(b) - kModelHelper.getNodeTreeHeight(a);
                })
                .forEach(function (instance) {
                    uiFactory.createNode(instance);
                    instance.components.array.forEach(function (instance) {
                        uiFactory.createComponent(instance);
                    });
                });
        }

        // listen to model changes on the editor
        kEditor.addListener(processModel);

        // process model to create the instance UIs
        processModel();

        $scope.$on('$destroy', function () {
            kEditor.removeListener(processModel);
        });
    });
