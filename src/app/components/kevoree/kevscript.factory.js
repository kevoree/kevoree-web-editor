'use strict';

angular.module('editorApp')
  .factory('kScript', function () {
    function Logger(tag) {
      this.tag = tag;
    }

    Logger.prototype = {
      info: function (msg) {
        console.log(this.tag, msg); // eslint-disable-line
      },
      debug: function (msg) {
        console.debug(this.tag, msg); // eslint-disable-line
      },
      error: function (msg) {
        console.error(this.tag, msg); // eslint-disable-line
      },
      warn: function (msg) {
        console.warn(this.tag, msg); // eslint-disable-line
      }
    };

    return new KevoreeKevscript(new Logger('KevScript'), {
      resolver: KevoreeKevscript.Resolvers.tagResolverFactory(new Logger('TagResolver'),
        KevoreeKevscript.Resolvers.modelResolverFactory(new Logger('ModelResolver'),
          KevoreeKevscript.Resolvers.registryResolverFactory(new Logger('RegistryResolver'))))
    });
  });
