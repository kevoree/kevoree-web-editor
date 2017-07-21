'use strict';

angular.module('editorApp')
  .directive('dropTarget', function ($parse) {
    var DND_CLASS = 'dnd-overlay';

    return {
      restrict: 'A',
      scope: false,
      link: function (scope, element, attrs) {
        var tid;
        var fn = $parse(attrs.dropTarget);
        var elem = jQuery(element[0]);
        var overlay = jQuery('<div class="'+DND_CLASS+'" style="display: none;"><p class="center-message">Drop to load the model</p></div>');

        elem.append(overlay);

        elem.on('dragleave', dragLeaveHandler);
        elem.on('dragover', dragOverHandler);
        elem.on('drop', dropHandler);

        scope.$on('$destroy', function() {
          elem.off('dragleave', dragLeaveHandler);
          elem.off('dragover', dragOverHandler);
          elem.off('drop', dropHandler);
        });

        function dropHandler(event) {
          var dataTransfer = event.originalEvent.dataTransfer;
          if (dataTransfer) {
            if (dataTransfer.files.length) {
              var file = dataTransfer.files[0];
              var reader = new FileReader();

              reader.onloadend = function (event) {
                scope.$apply(function () {
                  fn(scope, {
                    $event: event,
                    $data: event.target.result,
                    $name: file.name
                  });
                });
              };

              reader.readAsText(file);
            }
          }

          event.stopPropagation();
          event.preventDefault();
          overlay.hide();
        }

        function dragOverHandler(event) {
          clearTimeout(tid);
          event.stopPropagation();
          event.preventDefault();
          overlay.show();
        }

        function dragLeaveHandler(event) {
          tid = setTimeout(function () {
            event.stopPropagation();
            overlay.hide();
          }, 200);
        }
      }
    };
  });
