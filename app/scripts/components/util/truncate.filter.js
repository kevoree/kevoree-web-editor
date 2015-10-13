'use strict';

angular.module('editorApp')
    .filter('truncate', function () {
        return function (text, length) {
            length = angular.isNumber(length) ? length : text.length;
            text = angular.isDefined(text) ? text : '';
            return text.substr(0, length) + (text.length > length ? '...' : '');
        };
    });
