'use strict';

angular.module('editorApp')
  .directive('dropTarget', function ($parse) {
    return {
      restrict: 'A',
      scope: false,
      link: function (scope, element, attrs) {
        var fn = $parse(attrs.dropTarget);
        var counter = 0;
        var id = 'id_' + Math.floor((Math.random()*10000)+1);

        function dropHandler(event) {
          event.preventDefault();
          event.stopPropagation();
          counter = 0;
          jQuery('#'+id).remove();
          
          if (event.dataTransfer) {
            if (event.dataTransfer.files.length) {
              var file = event.dataTransfer.files[0],
                reader = new FileReader();

              reader.onloadend = function(event) {
                scope.$apply(function() {
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
        }

        function dragOverHandler(event) {
          event.preventDefault();
          event.stopPropagation();
        }

        function dragEnterHandler(event) {
          event.preventDefault();
          event.stopPropagation();
          counter++;
          if (counter === 1) {
            element.append(
              angular.element('<div>', { id: id, class: 'overlay' }).append(
                angular.element('<p>', { class: 'center-message' })
                    .html('Drop to load the model')));
          }
        }

        function dragLeaveHandler(event) {
          event.preventDefault();
          event.stopPropagation();
          counter--;
          if (counter === 0) {
            element.find('#'+id).remove();
          }
        }

        element[0].addEventListener('dragenter', dragEnterHandler, false);
        element[0].addEventListener('dragleave', dragLeaveHandler, false);
        element[0].addEventListener('dragover', dragOverHandler, false);
        element[0].addEventListener('drop', dropHandler, false);

        scope.$on('$destroy', function() {
          element[0].removeEventListener('dragenter', dragEnterHandler);
          element[0].removeEventListener('dragleave', dragLeaveHandler);
          element[0].removeEventListener('dragover', dragOverHandler);
          element[0].removeEventListener('drop', dropHandler);
        });
      }
    };
  });
