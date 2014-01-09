define(
  [
    'abstraction/KEntity',
    'lib/kevoree',
    'util/Pooffs'
  ],

  function(KEntity, Kevoree, Pooffs) {
    var COUNT = 0;

    KGroup.ENTITY_TYPE = 'GroupType';

    Pooffs.extends(KGroup, KEntity);

    function KGroup(editor, type, version) {
      KEntity.prototype.constructor.call(this, editor, type, version);

      this._name = "group" + (COUNT++);
    }

    KGroup.prototype.getEntityType = function () {
      return KGroup.ENTITY_TYPE;
    }

    KGroup.prototype.accept = function (visitor) {
      visitor.visitGroup(this);
    }

    KGroup.prototype.getConnectedFragments = function () {
      if (this._instance) {
        return this._instance.getSubNodes();
      } else {
        return KEntity.prototype.getConnectedFragments.call(this);
      }
    }
    
    KGroup.prototype.disconnect = function (wire) {
      KEntity.prototype.disconnect.call(this, wire);

      if (wire.getTarget()) {
        // remove fragment dependant values from dictionnary
        var fragDics = this.getFragmentDictionaries();
        for (var i=0; i < fragDics.length; i++) {
          if (fragDics[i].getName() === wire.getTarget().getName()) {
            this.removeFragmentDictionary(fragDics[i].getName());
          }
        }
      }
    }

    return KGroup;
  }
);