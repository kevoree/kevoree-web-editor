'use strict';

angular.module('editorApp')
  .directive('tabTags', function () {
    return {
      restrict: 'AE',
      scope: {
        items: '='
      },
      templateUrl: 'scripts/app/treeview/tab-tags/tab-tags.html',
      controller: function ($scope, kEditor, kFactory, kModelHelper, KWE_TAG) {
        $scope.tag = '';
        $scope.tags = [];

        function processTags() {
          $scope.tags = [];
          $scope.items.forEach(function (item) {
            item.tags.forEach(function (tag) {
              if ($scope.tags.indexOf(tag) === -1) {
                $scope.tags.push(tag);
              }
            });
          });
        }

        processTags();
        var unwatchItems = $scope.$watchCollection('items', processTags);
        $scope.$on('$destroy', unwatchItems);

        $scope.addTag = function () {
          if ($scope.tag.trim().length > 0 && $scope.tag.indexOf(',') === -1) {
            $scope.tag = $scope.tag.trim();
            kEditor.disableListeners();
            $scope.items.forEach(function (item) {
              var instance = kEditor.getModel().findByPath(item.path);
              var tagMeta = instance.findMetaDataByID(KWE_TAG);
              if (!tagMeta) {
                tagMeta = kFactory.createValue();
                tagMeta.name = KWE_TAG;
                tagMeta.value = '';
                instance.addMetaData(tagMeta);
              }
              var tags = tagMeta.value.split(',').filter(function (tag) {
                return tag.trim().length > 0;
              });
              if (tags.indexOf($scope.tag) === -1) {
                tags.push($scope.tag);
              }
              item.tags = tags;
              tagMeta.value = tags.join(',');
            });
            $scope.tag = '';
            kEditor.enableListeners();
            kEditor.invokeListeners('modelUpdate');
          }
        };

        $scope.validate = function () {
          if ($scope.tag.indexOf(',') !== -1) {
            $scope.error = 'Character "," is not allowed in a tag';
          } else {
            $scope.error = null;
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
                item.tags = tags;
                tagMeta.value = tags.join(',');
                processTags();
              }
            }
          });
        };
      }
    };
  });
