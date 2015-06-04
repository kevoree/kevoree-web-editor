'use strict';

angular.module('editorApp')
    .directive('onData', function ($parse) {
        return {
            restrict: 'A',
            scope: false,
            link: function(scope, element, attrs) {
                var fn = $parse(attrs.onData);

                element.on('change', function (evt) {
                    console.log('change');
                    var reader = new FileReader();

                    reader.onload = function (evt) {
                        scope.$apply(function () {
                            fn(scope, { $data: evt.target.result });
                        });
                    };

                    try {
                        reader.readAsText(evt.target.files[0]);
                    } catch (err) {}
                });

                element.on('click', function () {
                    this.value = null;
                });
            }
        };
    });