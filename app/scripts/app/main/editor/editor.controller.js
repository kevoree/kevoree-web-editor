'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:EditorCtrl
 * @description
 * # EditorCtrl
 * Controller of the editorApp editor
 */
angular.module('editorApp')
    .controller('EditorCtrl', function ($scope, kEditor, ui, kModelHelper, kFactory, Notification, KWE_POSITION) {
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
                    accept = ui.getDropTarget();
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
            var pkgPath = obj.draggable.scope().tdef.pkgPath;
            var tdefName = obj.draggable.scope().tdef.name;
            var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
            var tdef = kModelHelper.findBestVersion(tdefs.array);
            var type = kModelHelper.getTypeDefinitionType(tdef);
            var editor = ui.getEditorContainer();

            function preProcess(instance) {
                instance.typeDefinition = tdef;
                instance.started = true;
                var pos = kFactory.createValue();
                pos.name = KWE_POSITION;
                pos.value = JSON.stringify({
                    x: ui.mousePos.x - editor.offsetLeft,
                    y: ui.mousePos.y - editor.offsetTop
                });
                instance.addMetaData(pos);
            }

            var model = kEditor.getModel();
            var dropTarget = ui.getDropTarget();
            var instance, node;
            switch (type) {
                case 'node':
                    instance = kFactory.createContainerNode();
                    instance.name = 'node'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    model.addNodes(instance);
                    if (dropTarget) {
                        node = model.findByPath(dropTarget.attr('data-path'));
                        if (node) {
                            node.addHosts(instance);
                        }
                    }
                    break;

                case 'group':
                    instance = kFactory.createGroup();
                    instance.name = 'group'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    model.addGroups(instance);
                    break;

                case 'component':
                    instance = kFactory.createComponentInstance();
                    instance.name = 'comp'+parseInt(Math.random()*1000);
                    instance.typeDefinition = tdef;
                    instance.started = true;
                    if (dropTarget) {
                        node = model.findByPath(dropTarget.attr('data-path'));
                        if (node) {
                            node.addComponents(instance);
                        }
                    } else {
                        Notification.warning({
                            title: 'Add component',
                            message: 'You have to drop components in nodes',
                            delay: 5000
                        });
                    }
                    break;

                case 'channel':
                    instance = kFactory.createChannel();
                    instance.name = 'chan'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    model.addHubs(instance);
                    break;
            }

            ui.setDropTarget(null);
            return true;
        };

        // init the UI kFactory
        ui.init();

        /**
         * Create svg UIs based on current kEditor.getModel()
         */
        function processModel() {
            var model = kEditor.getModel();

            model.hubs.array.forEach(function (instance) {
                ui.createChannel(instance);
            });

            model.nodes.array
                .sort(function (a, b) {
                    // TODO optimize this to loop only once to create node tree heights
                    return kModelHelper.getNodeTreeHeight(b) - kModelHelper.getNodeTreeHeight(a);
                })
                .forEach(function (instance) {
                    ui.createNode(instance);
                    instance.components.array.forEach(function (instance) {
                        ui.createComponent(instance);
                    });
                });

            model.groups.array.forEach(function (instance) {
                ui.createGroup(instance);

                instance.subNodes.array.forEach(function (node) {
                    ui.createGroupWire(instance, node);
                });
            });

            model.mBindings.array.forEach(function (binding) {
                ui.createBinding(binding);
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
