define(
  function () {

    function UIValue(ctrl) {
      this._ctrl = ctrl;
    }

    UIValue.prototype.getHTML = function () {
      return '';
    }

    UIValue.prototype.onHTMLAppended = function () {}

    UIValue.prototype.getValue = function () {
      var fragName = (this._ctrl.getFragmentName() && this._ctrl.getNodeName()) ? this._ctrl.getNodeName()+'-'+this._ctrl.getFragmentName()+'-' : '';
      console.log("UIValue: "+'#instance-attr-'+fragName+this._ctrl.getName());
      return $('#instance-attr-'+fragName+this._ctrl.getName()).val();
    }

    return UIValue;
  }
);