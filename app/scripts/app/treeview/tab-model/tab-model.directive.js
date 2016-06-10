'use strict';

angular.module('editorApp')
  .directive('tabModel', function ($timeout, kEditor, kModelHelper, kFactory) {
    return {
      restrict: 'AE',
      scope: {
        items: '=',
        onTagClicked: '='
      },
      templateUrl: 'scripts/app/treeview/tab-model/tab-model.html',
      link: function ($scope) {
        var pathId;
        var serializer = kFactory.createJSONSerializer();

        function processData() {
          var model = kEditor.getModel();
          $scope.typeDefs = [
            'Nodes', 'Components', 'Groups', 'Channels'
          ];
          $scope.instancesData = [
            kModelHelper.getNbNodes(model),
            kModelHelper.getNbComponents(model),
            kModelHelper.getNbGroups(model),
            kModelHelper.getNbChannels(model)
          ];

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
          $scope.onPathChanged();
        }

        function processTags() {
          $scope.tags = {};
          $scope.items.forEach(function processTag(item) {
            item.tags.forEach(function (tag) {
              if (!$scope.tags[tag]) {
                $scope.tags[tag] = [];
              }
              $scope.tags[tag].push(kEditor.getModel().findByPath(item.path));
            });
            if (item.children) {
              item.children.forEach(processTag);
            }
          });
        }

        function modelHandler() {
          processData();
          processTags();
        }

        modelHandler();
        var unwatchItems = $scope.$watchCollection('items', modelHandler);
        $scope.$on('$destroy', function () {
          unwatchItems();
          $timeout.cancel(pathId);
        });
      }
    };
  });
