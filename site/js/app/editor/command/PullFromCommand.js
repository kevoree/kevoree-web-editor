define(
  [
    'lib/kevoree',
    'lib/async',
    'util/ModelHelper'
  ],
  function (Kevoree, async, ModelHelper) {
    var TIMEOUT = 10000;
    var PULL = 'pull';

    function PullFromCommand() {
      this._id = null;
    }

    PullFromCommand.prototype.execute = function (nodeProps, grp, callback) {
      var that = this;
      clearTimeout(this._id);
      this._id = setTimeout(function () {
          return callback(new Error('Timeout: '+TIMEOUT+'ms'));
      }, TIMEOUT);

      var uris = ModelHelper.getNodeURIs(nodeProps, grp);

      var count = 0;
      var pullSuccess = false;
      var pulledModel = null;
      var connectionProcess = function (cb) {
        if (count >= uris.length) return cb(new Error('Unable to connect to any specified uris ['+uris.join(', ')+']'));
        var uri = uris[count];
        console.log('Trying to pull model from '+uri+' ...');
        var ws = new WebSocket(uris[count]);
        ws.onopen = function onOpen() {
          ws.send(PULL);
        };
        ws.onmessage = function onMessage(e) {
          var data = '';
          if (typeof(e) === 'string') data = e;
          else data = e.data;

          // close client
          ws.close();

          // load model
          try {
            var jsonLoader = new Kevoree.org.kevoree.loader.JSONModelLoader();
            pulledModel = jsonLoader.loadModelFromString(data).get(0);
            console.log('Model pulled successfully from '+uri);
            pullSuccess = true;
          } catch (err) {
            console.log('Unable to load pulled model from '+uris[count]+'. Gonna try on an other URI if possible...', err);
            cb();
          }
          count++;
          cb();
        };
        ws.onerror = function onError() {
          count++;
          cb();
        }
      }

      async.until(function () { return pullSuccess; }, connectionProcess, function (err) {
        clearTimeout(that._id);
        return callback(err, pulledModel);
      });
    }

    return PullFromCommand;
  }
);