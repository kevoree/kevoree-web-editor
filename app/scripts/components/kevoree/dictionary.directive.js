'use strict';

angular.module('editorApp')
    .directive('kdic', function () {
        return {
            restrict: 'E',
            scope: {
                name: '=',
                attrs: '=',
                dictionary: '=',
                fragment: '='
            },
            templateUrl: 'scripts/components/kevoree/dictionary.html',
            controller: function ($scope) {
                $scope.isTruish = function (val) {
                    return (val === 'true' || val === true || val > 0);
                };
            }
        };
    });
