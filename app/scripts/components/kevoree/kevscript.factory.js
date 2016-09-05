'use strict';

angular.module('editorApp')
  .factory('kScript', function () {
    return new KevoreeKevscript(new KevoreeCommons.Logger('KevScript'));
  });
