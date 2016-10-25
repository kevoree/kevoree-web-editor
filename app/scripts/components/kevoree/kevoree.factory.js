'use strict';

angular.module('editorApp')
  .factory('kFactory', function () {
    return new KevoreeLibrary.factory.DefaultKevoreeFactory();
  });
