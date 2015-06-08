'use strict';

angular.module('editorApp')
    .directive('onData', function ($parse) {
        return {
            restrict: 'A',
            scope: false,
            link: function(scope, element, attrs) {
                var fn = $parse(attrs.onData);

                element.on('change', function (evt) {
                    console.log(evt);
                    var reader = new FileReader();

                    reader.onload = function (onLoadEvt) {
                        scope.$apply(function () {
                            fn(scope, {
                                $data: onLoadEvt.target.result,
                                $name: evt.target.files[0].name
                            });
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