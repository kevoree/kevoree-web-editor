define(
  function () {

    function Config () {}

    Config.CONTAINER_ID = 'editor';
    Config.HTTP = 'http://';
    Config.WS = 'ws://';
    Config.TCP = 'tcp';
    Config.BACKGROUND_IMG = 'img/background.jpg';
    Config.DEFAULT_HOST = '127.0.0.1';
    Config.DEFAULT_PORT_NAME = 'port';
    Config.DEFAULT_PORT_VAL = '9000';
    
    // Remote server default values
    Config.REMOTE_HOST    = '<%= remoteServer.host %>';             // default "localhost"
    Config.REMOTE_PORT    = '<%= remoteServer.port %>';             // default "3042"
    Config.REMOTE_LOAD    = '<%= remoteServer.actions.load %>';     // default "load"
    Config.REMOTE_MERGE   = '<%= remoteServer.actions.merge %>';    // default "merge"

    // Local Storage Constants
    Config.LS_ASK_BEFORE_LEAVING = 'askBeforeLeaving';
    Config.LS_COMPONENT_TOOLTIP = 'componentTooltip';
    Config.LS_DISPLAY_ALERT_POPUPS = 'displayAlertPopups';
    Config.LS_CONFIRM_ON_LOAD = 'confirmOnLoad';
    Config.LS_REMOTE_SERVER_HOST = 'remoteServerHost';
    Config.LS_REMOTE_SERVER_PORT = 'remoteServerPort';

    return Config;
  }
);