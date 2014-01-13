define(
  [
    'util/Config'
  ],
  function (Config) {
    function ResetRemoteServerSettingsCommand() {}
    
    ResetRemoteServerSettingsCommand.prototype.execute = function () {
      $('#remote-server-host').val(Config.REMOTE_HOST);
      $('#remote-server-port').val(Config.REMOTE_PORT);
      if (window.localStorage) {
        window.localStorage.setItem(Config.LS_REMOTE_SERVER_HOST, null);
        window.localStorage.setItem(Config.LS_REMOTE_SERVER_PORT, null);
      }
    }
    
    return ResetRemoteServerSettingsCommand;
  }
);