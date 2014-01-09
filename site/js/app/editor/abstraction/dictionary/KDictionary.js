define(
  [
    'util/Observer',
    'util/Pooffs',
    'util/Util'
  ],
  function (Observer, Pooffs, Util) {

    Pooffs.extends(KDictionary, Observer);

    function KDictionary(entity, isFragment) {
      Observer.prototype.constructor.call(this);
      this._isFragment = isFragment;
      this._name = null;
      this._entity = entity;
      this._values = [];
      
      // use default values if any
      var typeDef = entity.getEditor().getModel().findTypeDefinitionsByID(entity.getType()+'/'+entity.getVersion());
      if (typeDef && typeDef.dictionaryType && typeDef.dictionaryType.attributes) {
        var attrs = typeDef.dictionaryType.attributes.iterator();
        while (attrs.hasNext()) {
          var attr = attrs.next();
          if (!Util.parseBoolean(attr.getFragmentDependant())) {
            var value = require('factory/CFactory').getInstance().newValue();
            value.setName(attr.name);
            value.setValue(attr.defaultValue);
            value.addObserver(this);
            this.addValue(value);
          }
        }
      }
    }

    KDictionary.prototype.getEntity = function () {
      return this._entity;
    }

    KDictionary.prototype.getValues = function () {
      return this._values;
    }

    KDictionary.prototype.getValue = function (name) {
      for (var i in this._values) {
        if (this._values[i].getName() == name) {
          return this._values[i];
        }
      }
      return null;
    }

    KDictionary.prototype.addValue = function (val) {
      this._values.push(val);
      val.addObserver(this);
    }

    KDictionary.prototype.removeValue = function (val) {
      var index = this._values.indexOf(val);
      if (index != -1) {
        this._values.splice(index, 1);
        // update model
        this._entity.getEditor().update(this);
      }
    }

    KDictionary.prototype.setName = function (name) {
      this._name = name;
    }

    KDictionary.prototype.getName = function () {
      return this._name;
    }

    KDictionary.prototype.isFragment = function () {
      return this._isFragment;
    }

    KDictionary.prototype.accept = function (visitor) {
      if (this.isFragment()) {
        visitor.visitFragmentDictionary(this);
      } else {
        visitor.visitDictionary(this);
      }
    }

    // Override Observer.update()
    KDictionary.prototype.update = function (value) {
      this._entity.getEditor().updateModel(this);
    }

    return KDictionary;
  }
);