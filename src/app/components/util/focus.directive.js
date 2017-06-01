'use strict';

angular.module('editorApp')
  .directive('focus', function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        scope.$watch(attrs.focus, function (value) {
          var delay, show;
          if (angular.isNumber(value)) {
            delay = value;
            show = true;
          } else {
            delay = 0;
            show = Boolean(value);
          }
          if (show) {
            $timeout(function () {
              elem[0].focus();
              if (typeof elem[0].select === 'function') {
                elem[0].select();
              }
            }, delay);
          }
        });
      }
    };
  });
