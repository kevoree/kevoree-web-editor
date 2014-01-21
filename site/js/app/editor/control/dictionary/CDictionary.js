define(
  [
    'abstraction/dictionary/KDictionary',
    'control/AController',
    'presentation/dictionary/UIDictionary',
    'util/Pooffs'
  ],
  function (KDictionary, AController, UIDictionary, Pooffs) {

    Pooffs.extends(CDictionary, AController);
    Pooffs.extends(CDictionary, KDictionary);

    function CDictionary(entity, isFragment) {
      isFragment = isFragment || false;
      KDictionary.prototype.constructor.call(this, entity, isFragment);

      this._ui = new UIDictionary(this);
    }

    CDictionary.prototype.p2cSaveDictionary = function () {
      console.log("Saving dictionnary "+this.getName()+" for "+this.getEntity().getName());
      var attrs = this.getAttributes();
      var factory = require('factory/CFactory').getInstance();
      for (var i = 0; i < attrs.length; i++) {
        var val = this.getValue(attrs[i].getName());
        if (!val) {
          // no value created for this argument yet
          console.log("no value created for argument "+attrs[i].getName()+" yet");
          val = factory.newValue();
          val.setName(attrs[i].getName());
          this.addValue(val);
        }

        if (attrs[i].getFragmentDependant()) {
          // attribute is fragment dependant, it needs some fragment information
          val.setNodeName(this.getName());
          val.setFragmentName(this.getEntity().getName());
        }
        val.setValue(val.getUI().getValue());
      }
    }

    return CDictionary;
  }
);