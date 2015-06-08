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
            accept: function (ui) {
                var accept = false;
                var pkgPath = ui[0].dataset.pkgPath;
                var tdefName = ui[0].innerHTML.trim();
                var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
                var tdef = kModelHelper.findBestVersion(tdefs.array);
                var type = kModelHelper.getTypeDefinitionType(tdef);

                if (type === 'component') {
                    accept = uiFactory.getDropTarget();
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
         * @param ui
         */
        $scope.onDrop = function (evt, ui) {
            var pkgPath = ui.draggable.scope().tdef.pkgPath;
            var tdefName = ui.draggable.scope().tdef.name;
            var tdefs = kEditor.getModel().select(pkgPath+'/typeDefinitions[name='+tdefName+']');
            var tdef = kModelHelper.findBestVersion(tdefs.array);
            var type = kModelHelper.getTypeDefinitionType(tdef);
            var editor = uiFactory.getEditorContainer();

            function preProcess(instance) {
                instance.typeDefinition = tdef;
                instance.started = true;
                var pos = kFactory.createValue();
                pos.name = KWE_POSITION;
                pos.value = JSON.stringify({
                    x: uiFactory.mousePos.x - editor.offsetLeft,
                    y: uiFactory.mousePos.y - editor.offsetTop
                });
                instance.addMetaData(pos);
            }

            var model = kEditor.getModel();
            var dropTarget = uiFactory.getDropTarget();
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
                    }
                    break;

                case 'channel':
                    instance = kFactory.createChannel();
                    instance.name = 'chan'+parseInt(Math.random()*1000);
                    preProcess(instance);
                    model.addHubs(instance);
                    break;
            }

            uiFactory.setDropTarget(null);
            return true;
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

            model.mBindings.array.forEach(function (binding) {
                uiFactory.createBinding(binding);
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
