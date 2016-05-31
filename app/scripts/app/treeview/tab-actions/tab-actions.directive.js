'use strict';

angular.module('editorApp')
  .directive('tabActions', function () {
    return {
      restrict: 'AE',
      scope: {
        items: '='
      },
      templateUrl: 'scripts/app/treeview/tab-actions/tab-actions.html',
      controller: function ($scope, kEditor, kFactory, kModelHelper, KWE_TAG) {
        $scope.tag = '';
        $scope.tags = [];

        function processTags() {
          $scope.tags = [];
          $scope.items.forEach(function (item) {
            var instance = kEditor.getModel().findByPath(item.path);
            kModelHelper.getInstanceTags(instance).forEach(function (tag) {
              if ($scope.tags.indexOf(tag) === -1) {
                $scope.tags.push(tag);
              }
            });
          });
        }

        processTags();
        kEditor.addListener(processTags);
        var unwatchItems = $scope.$watchCollection('items', processTags);
        $scope.$on('$destroy', function () {
          kEditor.removeListener(processTags);
          unwatchItems();
        });

        $scope.addTag = function () {
          if ($scope.tag.length > 0) {
            $scope.items.forEach(function (item) {
              var instance = kEditor.getModel().findByPath(item.path);
              var tagMeta = instance.findMetaDataByID(KWE_TAG);
              if (!tagMeta) {
                tagMeta = kFactory.createValue();
                tagMeta.name = KWE_TAG;
                tagMeta.value = '';
                instance.addMetaData(tagMeta);
              }
              var tags = tagMeta.value.split(',');
              if (tags.indexOf($scope.tag) === -1) {
                tags.push($scope.tag);
              }
              tagMeta.value = tags.join(',');
              $scope.tag = '';
              processTags();
            });
          }
        };

        $scope.removeTag = function (tag) {
          $scope.items.forEach(function (item) {
            var instance = kEditor.getModel().findByPath(item.path);
            var tagMeta = instance.findMetaDataByID(KWE_TAG);
            if (tagMeta) {
              var tags = tagMeta.value.split(',');
              var i = tags.indexOf(tag);
              if (i !== -1) {
                tags.splice(i, 1);
                tagMeta.value = tags.join(',');
                processTags();
              }
            }
          });
        };
      }
    };
  });
