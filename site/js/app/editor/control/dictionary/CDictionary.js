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
      var attrs = this.getEntity().getDictionaryAttributes();
      var factory = require('factory/CFactory').getInstance();
      for (var i = 0; i < attrs.length; i++) {
        if (attrs[i].getFragmentDependant() === this.isFragment()) {
          var val = this.getValue(attrs[i].getName());
          if (val == null) {
            // no value created for this argument yet
            val = factory.newValue();
            val.setName(attrs[i].getName());
            this.addValue(val);
          }

          if (this.isFragment()) val.setFragmentName(this.getName());
          val.setValue(val.getUI().getValue());
        }
      }
    }

    return CDictionary;
  }
);