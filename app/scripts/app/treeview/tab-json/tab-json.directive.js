'use strict';

angular.module('editorApp')
  .directive('tabJson', function ($timeout, kFactory, kEditor) {
    return {
      restrict: 'AE',
      templateUrl: 'scripts/app/treeview/tab-json/tab-json.html',
      link: function ($scope) {
        var pathId;
        var serializer = kFactory.createJSONSerializer();

        $scope.path = '';
        $scope.elems = [];
        $scope.onPathChanged = function () {
          $timeout.cancel(pathId);
          pathId = $timeout(function () {
            var elems = kEditor.getModel().select($scope.path);
            if (elems) {
              $scope.elems = elems.array.map(function (elem) {
                return {
                  path: elem.path(),
                  content: JSON.stringify(JSON.parse(serializer.serialize(elem)), null, 2),
                  isCollapsed: true
                };
              });
            } else {
              $scope.elems.length = 0;
            }
          }, 500);
        };
        $scope.onPathChanged($scope.path);

        $scope.setPath = function (path) {
          $scope.path = path;
          $scope.elems = kEditor.getModel().select(path).array.map(function (elem) {
            return {
              path: elem.path(),
              content: JSON.stringify(JSON.parse(serializer.serialize(elem)), null, 2),
              isCollapsed: true
            };
          });
        };

        // var unwatchItems = $scope.$watchCollection('items', $scope.onPathChanged);
        $scope.$on('$destroy', function () {
          // unwatchItems();
          $timeout.cancel(pathId);
        });
      }
    };
  });
