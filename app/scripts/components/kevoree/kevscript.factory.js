'use strict';

angular.module('editorApp')
  .factory('kScript', function () {
    var noop = function noop() {};
    var logger = {
      info: function (tag, msg) {
        console.log('KevScript', msg); // eslint-disable-line
      },
      debug: function (tag, msg) {
        console.debug('KevScript', msg); // eslint-disable-line
      },
      error: function (tag, msg) {
        console.error('KevScript', msg); // eslint-disable-line
      },
      warn: function (tag, msg) {
        console.warn('KevScript', msg); // eslint-disable-line
      },
      toString: function () {
        return 'KevScript';
      },
      setLevel: noop,
      setTag: noop
    };

    return new KevoreeKevscript(logger, {
      resolver: KevoreeKevscript.Resolvers.tagResolverFactory(logger,
        KevoreeKevscript.Resolvers.modelResolverFactory(logger,
          KevoreeKevscript.Resolvers.registryResolverFactory(logger)))
    });
  });
