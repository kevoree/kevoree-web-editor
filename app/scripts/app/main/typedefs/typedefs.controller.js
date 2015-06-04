'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TypedefsCtrl
 * @description
 * # TypedefsCtrl
 * Controller of the editorApp TypeDefinition sidebar
 */
angular.module('editorApp')
    .controller('TypedefsCtrl', function ($scope, kEditor, uiFactory, kModelHelper) {
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

        $scope.hasPackages = function () {
            return Object.keys($scope.packages).length > 0;
        };

        $scope.onStart = function () {
            var container = document.getElementById('editor-container');
            this.offset = { left: container.offsetLeft, top: container.offsetTop };
        };

        $scope.onDrag = function (evt) {
            uiFactory.mousePos = { x: evt.clientX, y: evt.clientY };

            clearTimeout(this.timeout);
            if (this.hoveredNode) {
                this.hoveredNode.select('.bg').removeClass('hovered error');
            }

            this.timeout = setTimeout(function () {
                this.hoveredNode = uiFactory.getHoveredNode(
                    uiFactory.mousePos.x - this.offset.left,
                    uiFactory.mousePos.y - this.offset.top);
                if (this.hoveredNode) {
                    var nodeBg = this.hoveredNode.select('.bg');
                    nodeBg.addClass('hovered');

                    // TODO check if compatible
                }
            }.bind(this), 100);
        };

        $scope.onStop = function () {
            clearTimeout(this.timeout);
            if (this.hoveredNode) {
                this.hoveredNode.select('.bg').removeClass('hovered error');
            }
            delete this.timeout;
            delete this.offset;
            delete this.hoveredNode;
        };

        /**
         * Inflate $scope.packages with value from kEditor.getModel()
         */
        function processModel() {
            $scope.packages = {};
            var model = kEditor.getModel();

            model.select('**/typeDefinitions[*]')
                .array.forEach(function (tdef) {
                    var pkg = kModelHelper.genPkgName(tdef.eContainer());
                    $scope.packages[pkg]           = $scope.packages[pkg]       || {};
                    $scope.packages[pkg].tdefs     = $scope.packages[pkg].tdefs || {};
                    $scope.packages[pkg].collapsed = false;

                    $scope.packages[pkg].tdefs[tdef.name] = {
                        name: tdef.name,
                        type: kModelHelper.getTypeDefinitionType(tdef),
                        pkgPath: tdef.eContainer().path()
                    };
                });
        }

        // listen to model changes on the editor
        kEditor.addListener(processModel);

        // process model
        processModel();

        $scope.$on('$destroy', function () {
            kEditor.removeListener(processModel);
        });
    });
