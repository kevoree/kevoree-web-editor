'use strict';

angular.module('editorApp')
  .directive('fileread', [function () {
    return {
      controller: function ($scope, $element, $attrs) {
        $element.bind('change', function (event) {
          var reader = new FileReader();
          reader.onload = function (loadEvent) {
            $scope.fileread = loadEvent.target.result;
            $scope.$eval($attrs.onfileread);
          };
          reader.readAsBinaryString(event.target.files[0]);
        });
      }
    };
  }]);
