'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TypedefsCtrl
 * @description
 * # TypedefsCtrl
 * Controller of the editorApp TypeDefinition sidebar
 */
angular.module('editorApp')
    .controller('TypedefsCtrl', function($scope, kEditor, ui, kModelHelper, kFactory, kInstance, Notification, KWE_POSITION) {
        $scope.packages = {};

        $scope.dragDraggable = {
            animate: true,
            placeholder: 'keep',
            onStart: 'onStart',
            onDrag: 'onDrag',
            onStop: 'onStop'
        };

        $scope.dragOptions = {
            revert: 'invalid',
            helper: 'clone',
            addClasses: false,
            scroll: false,
            appendTo: '#tdef-drag-panel',
            containment: '#tdef-drag-panel',
            cursor: 'move',
            cursorAt: {
                top: -5,
                right: -5
            }
        };

        $scope.hasPackages = function() {
            return Object.keys($scope.packages).length > 0;
        };

        $scope.onStart = function(evt, obj) {
            ui.setDropTarget(null);

            if (obj.helper.hasClass('tdef-item-component') || obj.helper.hasClass('tdef-item-node')) {
                var container = document.getElementById('editor-container');
                this.offset = {
                    left: container.offsetLeft,
                    top: container.offsetTop
                };

                var pkgPath = obj.helper[0].dataset.pkgPath;
                var tdefName = obj.helper[0].innerHTML.trim();
                var tdefs = kEditor.getModel().select(pkgPath + '/typeDefinitions[name=' + tdefName + ']');
                this.typeDef = kModelHelper.findBestVersion(tdefs.array);
            }
        };

        $scope.onDrag = function(evt, obj) {
            ui.mousePos = {
                x: evt.clientX,
                y: evt.clientY
            };

            if (obj.helper.hasClass('tdef-item-component') || obj.helper.hasClass('tdef-item-node')) {
                clearTimeout(this.timeout);
                if (this.hoveredNode) {
                    this.hoveredNode.select('.bg').removeClass('hovered error');
                }

                this.timeout = setTimeout(function() {
                    this.hoveredNode = ui.getHoveredNode(
                        ui.mousePos.x - this.offset.left,
                        ui.mousePos.y - this.offset.top);
                    if (this.hoveredNode) {
                        var nodeBg = this.hoveredNode.select('.bg');
                        nodeBg.addClass('hovered');

                        if (!kModelHelper.isCompatible(this.typeDef, kEditor.getModel().findByPath(this.hoveredNode.attr('data-path')))) {
                            nodeBg.addClass('error');
                            ui.setDropTarget(null);
                        } else {
                            ui.setDropTarget(this.hoveredNode);
                        }
                    } else {
                        ui.setDropTarget(null);
                    }
                }.bind(this), 100);
            }
        };

        $scope.onStop = function(evt, obj) {
            if (obj.helper.hasClass('tdef-item-component') || obj.helper.hasClass('tdef-item-node')) {
                clearTimeout(this.timeout);
                if (this.hoveredNode) {
                    if (this.hoveredNode.select('.bg').hasClass('error')) {
                        Notification.warning({
                            title: 'Add component',
                            message: 'Targeted node platform cannot run this TypeDefinition',
                            delay: 5000
                        });
                    }
                    this.hoveredNode.select('.bg').removeClass('hovered error');
                } else {
                    if (obj.helper.hasClass('tdef-item-component')) {
                        Notification.warning({
                            title: 'Add component',
                            message: 'You have to drop components in nodes',
                            delay: 5000
                        });
                    }
                }

                delete this.typeDef;
                delete this.timeout;
                delete this.offset;
                delete this.hoveredNode;
            }
        };

        $scope.addInstance = function(tdef) {
            var tdefs = kEditor.getModel().select(tdef.pkgPath + '/typeDefinitions[name=' + tdef.name + ']');
            tdef = kModelHelper.findBestVersion(tdefs.array);
            var type = kModelHelper.getTypeDefinitionType(tdef);

            function preProcess(instance) {
                instance.typeDefinition = tdef;
                instance.started = true;
                var pos = kFactory.createValue();
                pos.name = KWE_POSITION;
                pos.value = JSON.stringify({
                    x: 100,
                    y: 100
                });
                instance.addMetaData(pos);
                kInstance.initDictionaries(instance);
            }

            var model = kEditor.getModel();
            var selectedNodes = ui.getSelectedNodes();
            var instance;
            switch (type) {
                case 'node':
                    if (selectedNodes.length > 0) {
                        selectedNodes.forEach(function(nodeElem) {
                            var node = model.findByPath(nodeElem.attr('data-path'));
                            if (node) {
                                instance = kFactory.createContainerNode();
                                instance.name = 'node' + parseInt(Math.random() * 1000);
                                preProcess(instance);
                                model.addNodes(instance);
                                node.addHosts(instance);
                            }
                        });
                    } else {
                        instance = kFactory.createContainerNode();
                        instance.name = 'node' + parseInt(Math.random() * 1000);
                        preProcess(instance);
                        model.addNodes(instance);
                    }
                    break;

                case 'group':
                    instance = kFactory.createGroup();
                    instance.name = 'group' + parseInt(Math.random() * 1000);
                    preProcess(instance);
                    model.addGroups(instance);
                    break;

                case 'component':
                    if (selectedNodes.length > 0) {
                        selectedNodes.forEach(function(nodeElem) {
                            var node = model.findByPath(nodeElem.attr('data-path'));
                            if (node) {
                                instance = kFactory.createComponentInstance();
                                instance.name = 'comp' + parseInt(Math.random() * 1000);
                                preProcess(instance);
                                node.addComponents(instance);
                            }
                        });
                    } else {
                        Notification.warning({
                            title: 'Add component',
                            message: 'You have to select at least one node',
                            delay: 5000
                        });
                    }
                    break;

                case 'channel':
                    instance = kFactory.createChannel();
                    instance.name = 'chan' + parseInt(Math.random() * 1000);
                    preProcess(instance);
                    model.addHubs(instance);
                    break;
            }
        };

        /**
         * Inflate $scope.packages with value from kEditor.getModel()
         */
        function processModel() {
            $scope.packages = [];
            var model = kEditor.getModel();

            var pkgsMap = {};
            model.select('**/typeDefinitions[*]')
                .array.forEach(function(tdef) {
                    var pkg = kModelHelper.genPkgName(tdef.eContainer());
                    pkgsMap[pkg] = pkgsMap[pkg] || {};
                    pkgsMap[pkg].tdefs = pkgsMap[pkg].tdefs || {};

                    var descMeta = tdef.findMetaDataByID('description');
                    var platforms = {};
                    tdef.select('deployUnits[name=*]/filters[name=platform]')
                        .array.forEach(function (meta) {
                            platforms[meta.value] = true;
                        });
                    pkgsMap[pkg].tdefs[tdef.name] = {
                        name: tdef.name,
                        type: kModelHelper.getTypeDefinitionType(tdef),
                        pkgPath: tdef.eContainer().path(),
                        platforms: Object.keys(platforms),
                        description: descMeta ? descMeta.value : null
                    };
                });

            Object.keys(pkgsMap).forEach(function(pkgName) {
                var pkg = {
                    name: pkgName,
                    collapsed: false,
                    tdefs: []
                };
                Object.keys(pkgsMap[pkgName].tdefs).forEach(function(tdefName) {
                    pkg.tdefs.push(pkgsMap[pkgName].tdefs[tdefName]);
                });
                $scope.packages.push(pkg);
            });
        }

        // listen to model changes on the editor
        kEditor.addListener(processModel);

        // process model
        processModel();

        $scope.$on('$destroy', function() {
            kEditor.removeListener(processModel);
        });
    });
