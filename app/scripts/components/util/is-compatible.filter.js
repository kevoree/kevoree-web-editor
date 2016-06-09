'use strict';

angular.module('editorApp')
  .filter('isCompatible', function (kModelHelper) {
    return function (items, type, node) {
      if (type === 'component') {
        return items.filter(function (item) {
          var isCompatible = kModelHelper.isCompatible(item.tdef, node);
          return isCompatible;
        });
      } else {
        return items;
      }
    };
  });
