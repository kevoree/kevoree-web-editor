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
          console.log('PROCESS TAGS');
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
          if ($scope.tag.trim().length > 0 && $scope.tag.indexOf(',') === -1) {
            $scope.tag = $scope.tag.trim();
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
              console.log('ADD TAG', $scope.tag, ' TO ', instance.name);
            });
            $scope.tag = '';
            processTags();
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
