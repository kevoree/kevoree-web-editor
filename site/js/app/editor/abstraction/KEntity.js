define(
  [
    'lib/kotlin/kotlin'
  ],

  function(Kotlin) {
    KEntity._COUNT = 0;

    function KEntity(editor, type, version) {
      this._editor = editor;
      this._type = type;
      this._version = version;
      this._name = type + KEntity._COUNT++;
      this._wires = [];

      this._dicAttrs = [];
      this._dictionary = require('factory/CFactory').getInstance().newDictionary(this, false);
      this._fragDictionaries = [];
    }

    KEntity.prototype.getName = function() {
      return this._name;
    }

    KEntity.prototype.setName = function(name) {
      if (this._instance) this._instance.setName(name);
      this._name = name;
    }

    KEntity.prototype.getType = function() {
      return this._type;
    }

    KEntity.prototype.getVersion = function () {
      return this._version;
    }

    KEntity.prototype.getEditor = function () {
      return this._editor;
    }

    KEntity.prototype.getWires = function() {
      return this._wires;
    }

    KEntity.prototype.addWire = function (wire) {
      if (this._wires.indexOf(wire) == -1) { // do not duplicate wire in array
        this._wires.push(wire);
      }
    }

    KEntity.prototype.getDictionary = function () {
      return this._dictionary;
    }

    KEntity.prototype.getFragmentDictionaries = function () {
      return this._fragDictionaries;
    }

    KEntity.prototype.getFragmentDictionary = function (fragmentName) {
      for (var i=0; i < this._fragDictionaries.length; i++) {
        if (this._fragDictionaries[i].getName() === fragmentName) {
          return this._fragDictionaries[i];
        }
      }
      return null;
    }
    
    KEntity.prototype.removeFragmentDictionary = function (fragmentName) {
      for (var i=0; i < this._fragDictionaries.length; i++) {
        var fragDic = this._fragDictionaries[i];
        if (fragDic.getName() === fragmentName) {
          this._fragDictionaries.splice(i, 1);
          this.getEditor().removeFromModel(fragDic);
          break;
        }
      }
    }

    KEntity.prototype.getDictionaryAttributes = function () {
      return this._dicAttrs;
    }

    KEntity.prototype.addFragmentDictionary = function (fragDic) {
      this._fragDictionaries.push(fragDic);
    }

    KEntity.prototype.addDictionaryAttribute = function (attr) {
      for (var i=0; i<this._dicAttrs.length; i++) {
        if (this._dicAttrs[i].getName() == attr.getName()) {
          this._dicAttrs[i] == attr;
          return;
        }
      }
      this._dicAttrs.push(attr);
    }

    KEntity.prototype.createWire = function () {
      var wire = require('factory/CFactory').getInstance().newWire(this);
      this.addWire(wire);
      return wire;
    }

    KEntity.prototype.remove = function () {
      this.getEditor().removeEntity(this);
      this.clearWires();
    }

    KEntity.prototype.disconnect = function (wire) {
      var index = this._wires.indexOf(wire);
      if (index != -1) {
        this._wires.splice(index, 1);
        this.getEditor().removeWire(wire);
      }
    }

    KEntity.prototype.clearWires = function () {
      var wires = this._wires.slice(0); // clone wires array
      for (var i=0; i < wires.length; i++) {
        wires[i].disconnect();
      }
      this._wires.length = 0;
    }

    KEntity.prototype.hasWires = function () {
      if (this._wires.length > 0) return true;
      else {
        if (this._children) {
          for (var i=0; i < this._children.length; i++) {
            if (this._children[i].hasWires()) return true;
          }
        }
      }
      return false;
    }

    KEntity.prototype.getConnectedFragments = function () {
      return new Kotlin.ArrayList();
    }

    return KEntity;
  }
);