'use strict';

angular.module('editorApp')
    .factory('util', function () {
        /**
         *
         * @param val
         * @returns {boolean}
         */
        function isTruish(val) {
            return (val === 'true' || val > 0 || val === true);
        }

        return {
            isTruish: isTruish
        };
    });
