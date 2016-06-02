'use strict';

angular.module('editorApp')
  .directive('tabModel', function (kEditor, kModelHelper) {
    return {
      restrict: 'AE',
      scope: {
        items: '=',
        onTagClicked: '='
      },
      templateUrl: 'scripts/app/treeview/tab-model/tab-model.html',
      link: function ($scope) {
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
        }

        function processTags() {
          $scope.tags = [];
          $scope.items.forEach(function (item) {
            item.tags.forEach(function (tag) {
              if ($scope.tags.indexOf(tag) === -1) {
                $scope.tags.push(tag);
              }
            });
            if (item.children) {
              item.children.forEach(function (child) {
                child.tags.forEach(function (tag) {
                  if ($scope.tags.indexOf(tag) === -1) {
                    $scope.tags.push(tag);
                  }
                });
              });
            }
          });
        }

        function modelHandler() {
          processData();
          processTags();
        }

        modelHandler();
        kEditor.addListener(processData);
        var unwatchTags = $scope.$watch('items', processTags, true);

        $scope.$on('$destroy', function () {
          kEditor.removeListener(processData);
          unwatchTags();
        });
      }
    };
  });
