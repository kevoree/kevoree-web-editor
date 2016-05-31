'use strict';

angular.module('editorApp')
  .directive('dicParam', function () {
    return {
      restrict: 'AE',
      scope: {
        param: '='
      },
      templateUrl: 'scripts/app/treeview/tab-params/dic-param/dic-param.html',
      link: function (scope) {
        console.log('dicParam', scope);
      }
    };
  });
