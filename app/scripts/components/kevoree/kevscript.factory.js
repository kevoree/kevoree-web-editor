'use strict';

angular.module('editorApp')
  .factory('kScript', function (kRegistry) {
    var kevs = new KevoreeKevscript(new KevoreeCommons.Logger('KevScript'));

    var changeUrl = function () {
      var url = new URL(kRegistry.getUrl());
      var conf = require('tiny-conf');
      conf.set('registry.host', url.hostname);
      conf.set('registry.port', url.port);
      conf.set('registry.ssl', url.protocol === 'https:');
    };

    kRegistry.onUrlChange(changeUrl);
    changeUrl();
    return kevs;
  });
