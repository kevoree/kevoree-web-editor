define(
  [
    'util/AlertPopupHelper',
    'util/Config'
  ],
  function (AlertPopupHelper, Config) {
    function SaveRemoteServerSettingsCommand() {}
    
    SaveRemoteServerSettingsCommand.prototype.execute = function () {
      var host = $('#remote-server-host').val();
      var port = $('#remote-server-port').val();
      
      var storage = window.localStorage;
      if (storage) {
        storage.setItem(Config.LS_REMOTE_SERVER_HOST, host);
        storage.setItem(Config.LS_REMOTE_SERVER_PORT, port);
        
        if (storage.getItem(Config.LS_REMOTE_SERVER_HOST)) {
          AlertPopupHelper.setHTML('<p>Remote server settings successfully <strong>updated</strong><br/>in your browser local storage.</p>');  
        } else {
          AlertPopupHelper.setHTML('<p>Remote server settings successfully <strong>saved</strong><br/>in your browser local storage.</p>');
        }
        AlertPopupHelper.setType(AlertPopupHelper.SUCCESS);
        AlertPopupHelper.show(2000);
        
      } else {
        // local storage is not available
        $('#save-remote-server').addClass('disabled');
        AlertPopupHelper.setHTML('<p id="local-storage-unavailable"><em><strong>HTML5 Local Storage</strong>&nbsp;is not avaible on this browser.<br/>You should consider using a real web browser like<a href="https://www.google.com/intl/fr/chrome/browser/">&nbsp;Google Chrome&nbsp;</a>or<a href="http://www.mozilla.org/fr/firefox/new/">&nbsp;Firefox</a>.</em></p>');
        AlertPopupHelper.setType(AlertPopupHelper.WARN);
        AlertPopupHelper.show();
      }
    }
    
    return SaveRemoteServerSettingsCommand;
  }
);