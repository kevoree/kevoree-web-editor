'use strict';

angular.module('editorApp')
  .directive('hljs', function () {
    return {
      restrict: 'AE',
      scope: { content: '=' },
      link: function(scope, element) {
        // element.addClass('hljs');
        console.log(scope.content);
        // element[0].innerHTML = scope.content;
        hljs.highlightBlock(element[0]);
      }
    };
  });
