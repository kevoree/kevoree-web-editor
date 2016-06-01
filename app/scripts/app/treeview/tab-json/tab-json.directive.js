'use strict';

angular.module('editorApp')
  .directive('tabJson', function (kFactory, kEditor) {
    return {
      restrict: 'AE',
      scope: {
        items: '='
      },
      templateUrl: 'scripts/app/treeview/tab-json/tab-json.html',
      link: function ($scope) {
        function processData() {
          $scope.items.forEach(function (item) {
            if (typeof item.isCollapsed === 'undefined') {
              item.isCollapsed = true;
            }
          });
        }

        processData();
        var unwatchItems = $scope.$watchCollection('items', processData);
        kEditor.addListener(processData);
        $scope.$on('$destroy', function () {
          kEditor.removeListener(processData);
          unwatchItems();
        });

        $scope.beautify = function (item) {
          var serializer = kFactory.createJSONSerializer();
          return JSON.stringify(JSON.parse(serializer.serialize(kEditor.getModel().findByPath(item.path))), null, 2);
        };
      }
    };
  });
