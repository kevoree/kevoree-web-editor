'use strict';

angular.module('editorApp')
    .directive('focus', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, elem, attrs) {
                var delay = 25;
                if (!isNaN(attrs.focus)) {
                    delay = parseInt(attrs.focus, 10);
                }
                var id = $timeout(function () {
                    elem.focus();
                }, delay);
                $scope.$on('$destroy', function () {
                    $timeout.cancel(id);
                });
            }
        };
    });
