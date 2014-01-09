define(
  [
    'util/Observable',
    'util/Pooffs'
  ],
  function (Observable, Pooffs) {

    Pooffs.extends(KValue, Observable);

    function KValue() {
      Observable.prototype.constructor.call(this);
      this._name = null;
      this._value = null;
      this._name = null;
    }

    KValue.prototype.getValue = function () {
      return this._value;
    }

    KValue.prototype.setValue = function (val) {
      this._value = val;
      this.notifyObservers();
    }

    KValue.prototype.getName = function () {
      return this._name;
    }

    KValue.prototype.setName = function (name) {
      this._name = name;
    }

    KValue.prototype.setFragmentName = function (nodeName) {
      this._fragmentName = nodeName;
    }

    KValue.prototype.getFragmentName = function () {
      return this._fragmentName;
    }

    KValue.prototype.accept = function (visitor) {
      visitor.visitValue(this);
    }

    return KValue;
  }
);