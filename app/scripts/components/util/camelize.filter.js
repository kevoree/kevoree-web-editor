'use strict';

angular.module('editorApp')
  .filter('camelize', function () {
    return function (text) {
      if (typeof text === 'string') {
        return text.replace(/(?:^|[-_])(\w)/g, function (_, c) {
          return c ? c.toUpperCase () : '';
        });
      } else {
        throw new Error('Camelize filter must be used on string only');
      }
    };
  });
