define(
  [
    'lib/kevoree',
    'lib/async',
    'util/ModelHelper'
  ],
  function (Kevoree, async, ModelHelper) {
    var TIMEOUT = 10000;
    var PUSH = 'push';

    function PushToCommand() {
      this._id = null;
    }

    PushToCommand.prototype.execute = function (nodeProps, model, grp, callback) {
      var that = this;
      callback = callback || function () {}

      clearTimeout(this._id);
      this._id = setTimeout(function () {
        return callback(new Error('Timeout: '+TIMEOUT+'ms'));
      }, TIMEOUT);

      try {
        var serializer = new Kevoree.org.kevoree.serializer.JSONModelSerializer();
        var modelStr = serializer.serialize(model);

        var uris = ModelHelper.getNodeURIs(nodeProps, grp);

        var count = 0;
        var pushSuccess = false;
        var connectionProcess = function (cb) {
          if (count >= uris.length) return cb(new Error('Unable to connect to any specified uris ['+uris.join(', ')+']'));
          var uri = uris[count];
          console.log('Trying to push model to '+uri);
          var ws = new WebSocket(uris[count]);
          ws.onopen = function onOpen() {
            ws.send(PUSH+'/'+modelStr);
            ws.close();
            pushSuccess = true;
            console.log('Model pushed successfully to '+uris[count]);
            count++;
            cb();
          };
          ws.onerror = function onError() {
            count++;
            cb();
          }
        }

        async.until(function () { return pushSuccess; }, connectionProcess, function (err) {
          clearTimeout(that._id);
          return callback(err);
        });

      } catch (err) {
        clearTimeout(this._id);
        return callback(err);
      }
    }

    return PushToCommand;
  }
);