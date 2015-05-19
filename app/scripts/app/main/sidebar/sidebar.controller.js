/**
 * @ngdoc function
 * @name editorApp.controller:SidebarCtrl
 * @description
 * # SidebarCtrl
 * Controller of the editorApp sidebar
 */
angular.module('editorApp')
    .controller('SidebarCtrl', function ($scope, kEditor, kModelHelper) {
        $scope.packages = {};
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
                        type: kModelHelper.getTypeDefinitionType(tdef)
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
