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

    // Local Storage Constants
    Config.LS_ASK_BEFORE_LEAVING = 'askBeforeLeaving';
    Config.LS_COMPONENT_TOOLTIP = 'componentTooltip';
    Config.LS_DISPLAY_ALERT_POPUPS = 'displayAlertPopups';
    Config.LS_CONFIRM_ON_LOAD = 'confirmOnLoad';

    return Config;
  }
);