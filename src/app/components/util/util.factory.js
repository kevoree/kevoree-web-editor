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

        /**
         * @param {number} length optional
         * @returns {string}
         */
      function randomString(length) {
        length = length || 5;
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i=0; i < length; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
      }

        /**
         * @param {number} min val optional (default: 0)
         * @param {number} max val optional (default: 65535)
         * @returns {number}
         */
      function randomNumber(min, max) {
        if (typeof min !== 'number') { min = 0; }
        if (typeof max !== 'number') { max = 65535; }
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

        /**
         * @returns {boolean}
         */
      function randomBoolean() {
        return Math.random() < 0.5;
      }

        /**
         * @param {array}
         * @returns {array} unique (using "===" check) items array
         */
      function arrayUnique(array) {
        var a = array.concat();
        for (var i=0; i<a.length; ++i) {
          for (var j=i+1; j<a.length; ++j) {
            if (a[i] === a[j]) {
              a.splice(j--, 1);
            }
          }
        }
        return a;
      }

      return {
        isTruish: isTruish,
        randomString: randomString,
        randomNumber: randomNumber,
        randomBoolean: randomBoolean,
        arrayUnique: arrayUnique
      };
    });
