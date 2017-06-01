'use strict';

angular.module('editorApp')
	.directive('tabActions', function ($filter, $uibModal, kEditor) {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'app/treeview/tab-actions/tab-actions.html',
    link: function ($scope) {
      function processData() {
        var model = kEditor.getModel();
        $scope.groups = model.groups.array;
        $scope.selectedGroup = $filter('orderBy')($scope.groups, 'name')[0];
      }

      function processTags() {
        $scope.tags = {};
        $scope.items.forEach(function processTag(item) {
          item.tags.forEach(function (tag) {
            if (!$scope.tags[tag]) {
              $scope.tags[tag] = [];
            }
            $scope.tags[tag].push(item);
          });
          if (item.children) {
            item.children.forEach(processTag);
          }
        });
        $scope.tagsCount = Object.keys($scope.tags).length;
      }

      function modelHandler() {
        processData();
        processTags();
      }

      modelHandler();
      var unwatchItems = $scope.$watchCollection('items', modelHandler);
      var unwatchTags = $scope.$watch('items', function () {
        processTags();
      }, true);
      $scope.$on('$destroy', function () {
        unwatchItems();
        unwatchTags();
      });

      $scope.openGroupModal = function () {
        $uibModal.open({
          templateUrl: 'app/main/instance/group.modal.html',
          size: 'md',
          resolve: {
            group: function () {
              return $scope.selectedGroup;
            }
          },
          controller: 'GroupModalCtrl'
        });
      };
    }
  };
});
