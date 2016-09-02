'use strict';

angular.module('editorApp')
  .factory('kFactory', function () {
    var kevoree = require('kevoree-library');
    return new kevoree.factory.DefaultKevoreeFactory();
  });
