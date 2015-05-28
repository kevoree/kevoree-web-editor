'use strict';

/**
 * @ngdoc function
 * @name editorApp.controller:TypedefsCtrl
 * @description
 * # TypedefsCtrl
 * Controller of the editorApp TypeDefinition sidebar
 */
angular.module('editorApp')
    .controller('TypedefsCtrl', function ($scope, kEditor, kModelHelper) {
        $scope.packages = {};

        $scope.dragDraggable = {
            animate: true,
            placeholder: 'keep'
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
