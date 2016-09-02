'use strict';

angular.module('editorApp')
  .directive('truncate', function ($sce) {
    return {
      restrict: 'E',
      scope: {
        content: '=',
        length: '='
      },
      template: '<p class="text-justify" ng-bind-html="trustedHtml"></p><a ng-if="expandable" href ng-click="toggle()">{{ toggleTxt }}</a>',
      link: function (scope) {
        function process() {
          var expanded = true;
          var length = 200;
          if (angular.isNumber(scope.length)) {
            length = scope.length;
          }
          var modifiedContent;
          scope.expandable = scope.content.length > length;
          scope.toggleTxt = 'Reduce';

          function reduce() {
            modifiedContent = scope.content.substr(0, length);
            if (scope.expandable) {
              modifiedContent += '...';
            }
            expanded = false;
            scope.toggleTxt = 'Read more';
            scope.trustedHtml = $sce.trustAsHtml(modifiedContent);
          }

          function expand() {
            modifiedContent = scope.content;
            expanded = true;
            scope.toggleTxt = 'Reduce';
            scope.trustedHtml = $sce.trustAsHtml(modifiedContent);
          }

          scope.toggle = function () {
            if (expanded) {
              reduce();
            } else {
              expand();
            }
          };

          reduce();
        }

        var unregister = scope.$watch('content', process);
        var unregister2 = scope.$watch('length', process);
        scope.$on('$destroy', function () {
          unregister();
          unregister2();
        });
      }
    };
  });
