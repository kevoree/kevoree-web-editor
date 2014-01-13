define(
  [
    'util/AlertPopupHelper',
    'util/Config',
    'lib/kevoree'
  ],

  function (AlertPopupHelper, Config, Kevoree) {
    var NAMESPACE = '.open-node-popup';
    var PULL = 'pull';

    function OpenFromNodeCommand() {
      this._timeoutID = null;
    };

    OpenFromNodeCommand.prototype.execute = function (uri, editor, popupShown) {
      clearTimeout(this._timeoutID);

      // hide alert when popup is closed
      $('body').off(NAMESPACE)
      $('body').on('hidden'+NAMESPACE, '#open-node-popup', function () {
        $('#open-node-alert').addClass('hide');
        $('#open-from-node').removeClass('disabled');
        popupShown = false;
      });

      // only do the process if 'open' button isn't disabled
      if (!$('#open-from-node').hasClass('disabled')) {
        // check uri
        // TODO check it better maybe ?
        if (uri && uri.length != 0) {
          // seems like we have a good uri
          // display loading alert
          var message = "<img src='img/ajax-loader-small.gif'/> Loading in progress, please wait...";

          if (!popupShown) {
            AlertPopupHelper.setHTML(message);
            AlertPopupHelper.setType(AlertPopupHelper.SUCCESS);
            AlertPopupHelper.show();

          } else {
            $('#open-node-alert').removeClass('alert-error');
            $('#open-node-alert').addClass('alert-success');
            $('#open-node-alert-content').html(message);
            $('#open-node-alert').removeClass('hide');
            $('#open-node-alert').addClass('in');
            $('#open-from-node').addClass('disabled');
          }

          var timeoutID = this._timeoutID = setTimeout(function () {
            loadTimeout(popupShown, uri);
          }, 10000);

          // open from WS
          var ws = new WebSocket('ws://'+uri);
          ws.binaryType = "arraybuffer";
          ws.onmessage = function (event) {
            try {
              var loader = new Kevoree.org.kevoree.loader.JSONModelLoader();
              var modelStr = '';
              if (typeof(event.data) === "string") {
                modelStr = event.data;
              } else {
                modelStr = String.fromCharCode.apply(null, new Uint8Array(event.data));
              }
              var model = loader.loadModelFromString(modelStr).get(0);
              editor.setModel(model);
              loadSucceed(timeoutID);
            } catch (err) {
              loadFailed(popupShown, uri, timeoutID);
            } finally {
              ws.close();
            }
          }

          ws.onopen = function () {
            ws.send(PULL);
          }

          ws.onerror = function () {
            loadFailed(popupShown, uri, timeoutID);
          }

        } else {
          // uri is malformed
          $('#open-node-alert-content').text("Malformed URI");
          $('#open-node-alert').removeClass('hide');
          $('#open-node-alert').addClass('in');
        }
      }
    }

    return OpenFromNodeCommand;

    function loadSucceed(timeoutID) {
      // clear timeout
      clearTimeout(timeoutID);

      // close 'Open from node' modal
      $('#open-node-popup').modal('hide');
      $('#open-from-node').removeClass('disabled');

      AlertPopupHelper.setText("Model loaded successfully");
      AlertPopupHelper.setType(AlertPopupHelper.SUCCESS);
      AlertPopupHelper.show(5000);
    }

    function loadFailed(popupShown, uri, timeoutID) {
      // clear timeout
      clearTimeout(timeoutID);

      var message = "Unable to get model from <strong>"+uri+"</strong><br/><small>Are you sure that your model is valid ? Is remote target reachable ?</small>";

      if (!popupShown) {
        AlertPopupHelper.setHTML(message);
        AlertPopupHelper.setType(AlertPopupHelper.ERROR);
        AlertPopupHelper.show(5000);

      } else {
        AlertPopupHelper.hide();
        $('#open-from-node').removeClass('disabled');
        $('#open-node-alert').removeClass('alert-success');
        $('#open-node-alert').addClass('alert-error');
        $('#open-node-alert-content').html(message);
        $('#open-node-alert').removeClass('hide');
        $('#open-node-alert').addClass('in');
      }
    }

    function loadTimeout(popupShown, uri) {
      var message = "Unable to get model from <strong>"+uri+"</strong><br/><small>Request timed out (10 seconds).</small>";

      if (!popupShown) {
        AlertPopupHelper.setHTML(message);
        AlertPopupHelper.setType(AlertPopupHelper.ERROR);
        AlertPopupHelper.show(5000);

      } else {
        $('#open-from-node').removeClass('disabled');
        $('#open-node-alert').removeClass('alert-success');
        $('#open-node-alert').addClass('alert-error');
        $('#open-node-alert-content').html(message);
        $('#open-node-alert').removeClass('hide');
        $('#open-node-alert').addClass('in');
      }
    }
  }
);