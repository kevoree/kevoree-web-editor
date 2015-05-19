/**
 * @ngdoc function
 * @name editorApp.controller:EditorCtrl
 * @description
 * # EditorCtrl
 * Controller of the editorApp editor
 */
angular.module('editorApp')
    .controller('EditorCtrl', function ($scope, kEditor, uiFactory) {
        /**
         * Create svg UIs based on current kEditor.getModel()
         */
        function processModel() {
            var model = kEditor.getModel();

            model.groups.array.forEach(function (elem) {
                uiFactory.createGroup(elem);
            });

            model.nodes.array.forEach(function (elem) {
                uiFactory.createNode(elem);
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
