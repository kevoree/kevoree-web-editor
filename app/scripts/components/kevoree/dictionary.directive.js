'use strict';

angular.module('editorApp')
  .directive('kdic', function () {
    return {
      restrict: 'E',
      scope: {
        name: '=',
        attrs: '=',
        dictionary: '=',
        fragment: '='
      },
      templateUrl: 'scripts/components/kevoree/dictionary.html',
      controller: function ($scope) {
        $scope.isTruish = function (val) {
          return (val === 'true' || val === true || val > 0);
        };

        $scope.isReadOnly = function () {
          if ($scope.dictionary && $scope.dictionary.eContainer()) {
            var val = $scope.dictionary.eContainer().findMetaDataByID('access_mode');
            return (val && val.value === 'read-only');
          }
          return false;
        };
      }
    };
  });
