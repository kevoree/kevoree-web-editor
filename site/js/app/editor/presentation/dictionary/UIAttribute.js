define(
  function () {

    function UIAttribute(ctrl) {
      this._ctrl = ctrl;
    }

    UIAttribute.prototype.getHTML = function () {
      return '';
    }

    UIAttribute.prototype.onHTMLAppended = function () {}

    return UIAttribute;
  }
);