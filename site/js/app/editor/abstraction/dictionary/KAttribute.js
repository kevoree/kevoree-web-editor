define(
  function () {
    function KAttribute() {
      this._name = null;
      this._enum = [];
      this._fragmentDependant = false;
      this._optional = false;
      this._defaultValue = null;
    }

    KAttribute.prototype.getName = function () {
      return this._name;
    }

    KAttribute.prototype.getEnum = function () {
      return this._enum;
    }

    KAttribute.prototype.getFragmentDependant = function () {
      return this._fragmentDependant;
    }

    KAttribute.prototype.getOptional = function () {
      return this._optional;
    }

    KAttribute.prototype.setName = function (name) {
      this._name = name;
    }

    KAttribute.prototype.setEnum = function (_enum) {
      this._enum = _enum;
    }

    KAttribute.prototype.getPossibleValues = function () {
      // TODO process enum
      return [];
    }

    KAttribute.prototype.getType = function () {
      // TODO process enum or datatype
      return 'raw';
    }

    KAttribute.prototype.getSelected = function () {
      // TODO process possible value & defaultValue so we find the index in the possibleValues array
      // for default one, and return it here
      return 0;
    }

    KAttribute.prototype.setFragmentDependant = function (isDependant) {
      this._fragmentDependant = isDependant;
    }

    KAttribute.prototype.setOptional = function (isOptional) {
      this._optional = isOptional;
    }

    KAttribute.prototype.setDefaultValue = function (val) {
      this._defaultValue = val;
    }

    KAttribute.prototype.getDefaultValue = function () {
      return this._defaultValue;
    }

    return KAttribute;
  }
);