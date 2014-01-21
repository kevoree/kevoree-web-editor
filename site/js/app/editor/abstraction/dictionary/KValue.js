define(
  [
    'util/Observable',
    'util/Pooffs'
  ],
  function (Observable, Pooffs) {

    Pooffs.extends(KValue, Observable);

    function KValue() {
      Observable.prototype.constructor.call(this);
      this._value = null;
      this._name = null;
    }

    KValue.prototype.getValue = function () {
      return this._value;
    }

    KValue.prototype.setValue = function (val) {
      this._value = val;
      console.log("Value "+this._value+" set for "+this._name+((this._fragmentName && this._nodeName) ? " ("+this._fragmentName+"@"+this._nodeName+")" : ""));
      this.notifyObservers();
    }

    KValue.prototype.getName = function () {
      return this._name;
    }

    KValue.prototype.setName = function (name) {
      this._name = name;
    }

    KValue.prototype.setFragmentName = function (fragmentName) {
      this._fragmentName = fragmentName;
    }

    KValue.prototype.getFragmentName = function () {
      return this._fragmentName;
    }

    KValue.prototype.setNodeName = function (nodeName) {
      this._nodeName = nodeName;
    }

    KValue.prototype.getNodeName = function () {
      return this._nodeName;
    }

    KValue.prototype.accept = function (visitor) {
      visitor.visitValue(this);
    }

    return KValue;
  }
);