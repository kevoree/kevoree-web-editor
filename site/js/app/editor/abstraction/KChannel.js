define(
  [
    'abstraction/KEntity',
    'util/Pooffs',
    'lib/kotlin/kotlin'
  ],

  function(KEntity, Pooffs, Kotlin) {
    var COUNT = 0;

    KChannel.ENTITY_TYPE = 'ChannelType';

    Pooffs.extends(KChannel, KEntity);

    function KChannel(editor, type, version) {
      KEntity.prototype.constructor.call(this, editor, type, version);

      this._name = 'chan' + (COUNT++);
    }

    KChannel.prototype.getEntityType = function () {
      return KChannel.ENTITY_TYPE;
    }

    KChannel.prototype.accept = function (visitor) {
      visitor.visitChannel(this);
    }

    // Overriding addWire from KEntity in order to add the instance to the model
    // cause if the wire has been added here, it means that it is plugged from one hand
    // to another (port -> chan)
    KChannel.prototype.addWire = function (wire) {
      if (this._wires.indexOf(wire) == -1) { // do not duplicate wire in array
        this._wires.push(wire);
        this.getEditor().addWire(wire);

        var attrs   = this.getDictionaryAttributes(),
            factory = require('factory/CFactory').getInstance();

        // check if a fragment dictionary is needed (if 0 fragDep attributes = no)
        var fragDicNeeded = false;
        for (var i=0; i < attrs.length; i++) {
          if (attrs[i].getFragmentDependant()) {
            fragDicNeeded = true;
            break;
          }
        }
        
        // so if there is at least one fragDep attribute
        if (fragDicNeeded) {
          // try to retrieve fragment dictionary by name
          var fragmentName = wire.getOrigin().getComponent().getParent().getName();
          var fragDic = this.getFragmentDictionary(fragmentName);
          if (fragDic == null) {
            // or create it if it does not exist yet
            fragDic = factory.newFragmentDictionary(this);
            fragDic.setName(fragmentName);
            // add it to the channel
            this.addFragmentDictionary(fragDic);
            console.log('FragDic added on '+this._name+' with name "'+fragDic.getName()+'"');
          }
        }
      }
    }

    KChannel.prototype.getConnectedFragments = function () {
      var nodes = new Kotlin.ArrayList(),
        alreadyAddedNode = {},
        model = this.getEditor().getModel();

      var wires = this.getWires();
      for (var i=0; i < wires.length; i++) {
        var nodeName = wires[i].getOrigin().getComponent().getParent().getName();
        if (!alreadyAddedNode[nodeName]) {
          var instance = model.findNodesByID(nodeName);
          if (instance != null) {
            nodes.add(instance);
            alreadyAddedNode[nodeName] = nodeName;
          }
        }
      }

      return nodes;
    }

    KChannel.prototype.disconnect = function (wire) {
      KEntity.prototype.disconnect.call(this, wire);

      // remove fragment dependant values from dictionnary
      var fragDics = this.getFragmentDictionaries();
      for (var i=0; i < fragDics.length; i++) {
        if (fragDics[i].getName() === wire.getOrigin().getComponent().getParent().getName()) {
          for (var j in this._wires) {
            // if there is another wire connected to this platform, then keep the fragDic
            if (this._wires[j].getOrigin().getComponent().getParent().getName() == fragDics[i].getName()) return;
          }
          // otherwise, if no other wire is connected to fragDics[i].getName()'s platform: then remove dictionary
          this.removeFragmentDictionary(fragDics[i].getName());
        }
      }
    }

    return KChannel;
  }
);