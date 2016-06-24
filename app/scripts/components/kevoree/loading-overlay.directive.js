'use strict';

angular.module('editorApp')
  .directive('loadingOverlay', function (kEditor) {
    return {
      restrict: 'A',
      scope: false,
      link: function (scope, elem) {
        var id = 'id_' + Math.floor((Math.random()*10000)+1);
        var overlay = angular.element('<div>', { id: id, class: 'overlay' }).append(
            angular.element('<p>', { class: 'center-message' }).html('Loading model...'));

        function preSetModelHandler() {
          elem.append(overlay);
        }

        function postSetModelHandler() {
          overlay.remove();
        }

        var unregister = kEditor.addPreSetModelHandler(preSetModelHandler);
        var unregister2 = kEditor.addPostSetModelHandler(postSetModelHandler);
        scope.$on('$destroy', function () {
          unregister();
          unregister2();
        });
      }
    };
  });
