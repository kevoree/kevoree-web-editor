'use strict';

angular.module('editorApp')
    .filter('trustHtml', function ($sce) {
      return function (text) {
        return $sce.trustAsHtml(text);
      };
    });
