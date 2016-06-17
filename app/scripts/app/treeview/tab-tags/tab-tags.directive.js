'use strict';

angular.module('editorApp')
  .directive('tabTags', function () {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: 'scripts/app/treeview/tab-tags/tab-tags.html',
      controller: function ($scope, kEditor, kFactory, kModelHelper, KWE_TAG) {
        $scope.tag = '';
        $scope.tags = [];

        function processTags() {
          $scope.tags = [];

          $scope.selectedItems.forEach(function (item) {
            var instance = kEditor.getModel().findByPath(item.path);
            kModelHelper.getTags(instance).forEach(function (tag) {
              if ($scope.tags.indexOf(tag) === -1) {
                $scope.tags.push(tag);
              }
            });
          });
        }

        /**
         * This does not mutate the given str
         */
        function removeTagFromStr(tag, str) {
          var tags = str.split(',');
          var i = tags.indexOf(tag);
          if (i !== -1) {
            tags.splice(i, 1);
          }
          return tags;
        }

        processTags();
        var unwatchItems = $scope.$watchCollection('selectedItems', processTags);
        $scope.$on('$destroy', unwatchItems);

        $scope.addTag = function () {
          if ($scope.tag.trim().length > 0 && $scope.tag.indexOf(',') === -1) {
            $scope.tag = $scope.tag.trim();
            $scope.selectedItems.forEach(function (item) {
              var instance = kEditor.getModel().findByPath(item.path);
              var tagMeta = instance.findMetaDataByID(KWE_TAG);
              if (!tagMeta) {
                tagMeta = kFactory.createValue();
                tagMeta.name = KWE_TAG;
                tagMeta.value = '';
                instance.addMetaData(tagMeta);
              }
              var tags = kModelHelper.getTags(instance);
              if (tags.indexOf($scope.tag) === -1) {
                // add tag to instance in model
                tags.push($scope.tag);
                // add tag in view
                item.tags.push($scope.tag);
              }
              if ($scope.tags.indexOf($scope.tag) === -1) {
                // add tag in tag list in view
                $scope.tags.push($scope.tag);
              }
              tagMeta.value = tags.join(',');
            });
            $scope.tag = '';
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
          $scope.tags.splice($scope.tags.indexOf(tag), 1);
          $scope.selectedItems.forEach(function (item) {
            var instance = kEditor.getModel().findByPath(item.path);
            var tagMeta = instance.findMetaDataByID(KWE_TAG);
            if (tagMeta) {
              var newTags = removeTagFromStr(tag, tagMeta.value);
              tagMeta.value = newTags.join(',');
              item.tags = newTags;
            }
          });
        };
      }
    };
  });
