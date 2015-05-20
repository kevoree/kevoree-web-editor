'use strict';

angular.module('editorApp')
    .directive('onData', function ($parse) {
        return {
            restrict: 'A',
            scope: false,
            link: function(scope, element, attrs) {
                var fn = $parse(attrs.onData);

                element.on('change', function (onChangeEvent) {
                    var reader = new FileReader();

                    reader.onload = function (evt) {
                        scope.$apply(function () {
                            fn(scope, { $data: evt.target.result });
                        });
                    };

                    reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
                });
            }
        };
    });