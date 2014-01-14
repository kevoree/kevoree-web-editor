define(
  [
    'lib/kevoree-commons',
    'lib/kevoree',
    'util/Config'
  ],

  function (KevoreeCommons, Kevoree, Config) {
    return KevoreeCommons.Resolver.extend({
      toString: 'MVNResolver',

      resolve: function (deployUnit, callback) {
        var host = $('#remote-server-host').val() || Config.REMOTE_HOST;
        var port = $('#remote-server-port').val() || Config.REMOTE_PORT;
        $.ajax({
          url: 'http://'+host+':'+port+'/'+Config.REMOTE_MERGE,
          type: 'POST',
          timeout: 30000,
          data: {
            libz: {
              java: [
                {
                  groupID:    deployUnit.groupName,
                  artifactID: deployUnit.name,
                  version:    deployUnit.version
                }
              ]
            }
          },
          dataType: 'jsonp',
          success: function (res) {
            switch (res.result) {
              case 1:
                var loader = new Kevoree.org.kevoree.loader.JSONModelLoader();
                var model = loader.loadModelFromString(JSON.stringify(res.model)).get(0);
                callback(null, null, model);
                break;

              default:
                console.log("error", res.message);
                break;
            }
          },
          error: function (res) {
            console.log("error", res);
          }
        });
      },

      uninstall: function (deployUnit, callback) {
        // we dont really install thing client-side, so
        // there is not much to do in this uninstall function.
        callback();
      }
    });
  }
);