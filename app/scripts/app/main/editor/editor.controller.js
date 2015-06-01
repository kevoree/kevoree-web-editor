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
                var accept = false;
                var pkgPath = obj[0].dataset.pkgPath;
                var tdefName = obj[0].innerHTML.trim();
                var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
                var tdef = kModelHelper.findBestVersion(tdefs.array);
                var type = kModelHelper.getTypeDefinitionType(tdef);

                if (type === 'component') {
                    accept = uiFactory.getNodePathAtPoint(uiFactory.mousePos.x, uiFactory.mousePos.y);
                } else {
                    accept = true;
                }

                // TODO improve to handle TypeDef checks
                return accept;
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
            var instance, path, node;
            switch (type) {
                case 'node':
                    instance = kFactory.createContainerNode();
                    instance.name = 'node'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    path = uiFactory.getNodePathAtPoint(evt.clientX, evt.clientY);
                    model.addNodes(instance);
                    if (path) {
                        node = model.findByPath(path);
                        if (node) {
                            node.addHosts(instance);
                        }
                    }
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
                    path = uiFactory.getNodePathAtPoint(evt.clientX, evt.clientY);
                    if (path) {
                        node = model.findByPath(path);
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
                    // TODO optimize this to loop only once to create node tree heights
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
