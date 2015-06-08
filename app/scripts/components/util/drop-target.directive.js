'use strict';

angular.module('editorApp')
    .directive('dropTarget', function ($parse) {
        return {
            restrict: 'A',
            scope: false,
            link: function(scope, element, attrs) {
                var fn = $parse(attrs.dropTarget);

                element.on('dragover', function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                });

                element.on('drop', function (evt) {
                    if (evt.originalEvent.dataTransfer) {
                        if (evt.originalEvent.dataTransfer.files.length) {
                            evt.preventDefault();
                            evt.stopPropagation();

                            var file = evt.originalEvent.dataTransfer.files[0],
                                reader = new FileReader();

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
                });
            }
        };
    });