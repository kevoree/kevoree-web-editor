'use strict';

angular.module('editorApp')
  .directive('hljs', function () {
    return {
      restrict: 'AE',
      scope: { content: '=' },
      link: function(scope, element) {
        // element.addClass('hljs');
        // element[0].innerHTML = scope.content;
        hljs.highlightBlock(element[0]);
      }
    };
  });
