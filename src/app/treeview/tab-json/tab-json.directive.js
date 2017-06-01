'use strict';

angular.module('editorApp')
  .directive('tabJson', function ($timeout, kFactory, kEditor) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: 'app/treeview/tab-json/tab-json.html',
      link: function ($scope) {
        var pathId;
        var serializer = kFactory.createJSONSerializer();

        $scope.path = '';
        $scope.elems = [];
        $scope.collapsed = {};

        function process() {
          var elems = kEditor.getModel().select($scope.path);
          if (elems) {
            $scope.elems = elems.array.map(function (elem) {
              if (!$scope.collapsed.hasOwnProperty(elem.path())) {
                $scope.collapsed[elem.path()] = true;
              }
              return {
                path: elem.path(),
                content: JSON.stringify(JSON.parse(serializer.serialize(elem)), null, 2)
              };
            });
          } else {
            $scope.elems.length = 0;
          }
        }

        $scope.onPathChanged = function () {
          $timeout.cancel(pathId);
          pathId = $timeout(function () {
            process();
          }, 500);
        };
        process();

        $scope.setPath = function (path) {
          $scope.path = path;
          process();
        };

        var unregister = kEditor.addNewModelListener('treeview', process);
        $scope.$on('$destroy', function () {
          unregister();
          $timeout.cancel(pathId);
        });
      }
    };
  });
