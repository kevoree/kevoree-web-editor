define(
  [
    'abstraction/KEntity',
    'abstraction/KComponent',
    'abstraction/property/KNodeProperties',
    'util/Pooffs'
  ],

  function(KEntity, KComponent, KNodeProperties, Pooffs) {
    var COUNT = 0;

    KNode.ENTITY_TYPE = 'NodeType';

    Pooffs.extends(KNode, KEntity);

    function KNode(editor, type, version) {
      KEntity.prototype.constructor.call(this, editor, type, version);

      this._parent = null;
      this._children = new Array();
      this._name = 'node'+ COUNT++;
      this._props = require('factory/CFactory').getInstance().newNodeProperties(this);
    }

    KNode.prototype.getEntityType = function () {
      return KNode.ENTITY_TYPE;
    }

    KNode.prototype.addChild = function (entity) {
      if (this.isValidChildEntity(entity)) {
        var index = this._children.indexOf(entity);
        if (index == -1) { // do not duplicate instances inside array
          this._children.push(entity);
          entity.setParent(this);
          this.getEditor().addNestableEntity(entity);
        }
        return true;
      }
      return false;
    }

    KNode.prototype.getChildren = function () {
      return this._children;
    }

    KNode.prototype.getEntity = function (name) {
      for (var i=0; i < this._children.length; i++) {
        if (this._children[i].getName() == name) {
          return this._children[i];
        } else {
          if (this._children[i].getEntity && typeof(this._children[i].getEntity) == "function") {
            var entity = this._children[i].getEntity(name);
            if (entity != null) return entity;
          }
        }
      }
      return null;
    }

    KNode.prototype.hasChild = function (entity) {
      for (var i=0; i < this._children.length; i++) {
        if (this._children[i].getName() == entity.getName()) {
          return true;
        }
      }
      return false;
    }

    KNode.prototype.removeChild = function (entity) {
      var index = this._children.indexOf(entity);
      if (index != -1) {
        this._children.splice(index, 1);
        // update typeCounter
        this.getEditor().removeNestableEntity(entity);
        entity.setParent(null); // TODO changethat; this is ugly, cause if you add before removing, you got a null on parent
      }
    }

    KNode.prototype.isValidChildEntity = function (entity) {
      return ((entity.getEntityType() == KNode.ENTITY_TYPE
        || entity.getEntityType() == KComponent.ENTITY_TYPE)
        && this !== entity);
    }

    KNode.prototype.setParent = function (entity) {
      this._parent = entity;
    }

    KNode.prototype.getParent = function () {
      return this._parent;
    }

    // Overriding addWire from KEntity in order to add the instance to the model
    // cause if the wire has been added here, it means that it is plugged from one hand
    // to another (group -> node)
    KNode.prototype.addWire = function (wire) {
      if (this._wires.indexOf(wire) == -1) { // do not duplicate wire in array
        this._wires.push(wire);
        this.getEditor().addWire(wire);

        // add fragment dependant value to wire's origin dictionary
        var attrs = wire.getOrigin().getDictionaryAttributes(),
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
          var fragDic = wire.getOrigin().getFragmentDictionary(this._name);
          if (fragDic == null) {
            // or create it if it does not exist yet
            fragDic = factory.newDictionary(wire.getOrigin(), true);
            fragDic.setName(this._name);
            // add it to the group
            wire.getOrigin().addFragmentDictionary(fragDic);
          }
        }
      }
    }

    KNode.prototype.disconnect = function (wire) {
      KEntity.prototype.disconnect.call(this, wire);

      // remove fragment dependant values from dictionnary
      var fragDics = wire.getOrigin().getFragmentDictionaries();
      for (var i=0; i < fragDics.length; i++) {
        if (fragDics[i].getName() === this._name) {
          var values = fragDics[i].getValues().slice(0); // work on a copy because we are going to do some deletion so indexes will change
          for (var j=0; j < values.length; j++) {
            fragDics[i].removeValue(values[j]);
          }
        }
      }
    }

    KNode.prototype.hasChildren = function () {
      return this._children.length > 0;
    }

    // Override KEntity.remove()
    KNode.prototype.remove = function () {
      // tell my children to kill themselves x.x
      var children = this._children.slice(0);
      for (var i = 0; i < children.length; i++) {
        children[i].remove();
      }

      this._children = []; // reset my children :'(

      // tell my parent that I'm gone *sob*
      if (this._parent) {
        this._parent.removeChild(this);
      }

      // tell node properties object to remove too
      this._props.remove();

      KEntity.prototype.remove.call(this);
    }

    /**
     * @returns {number} max depth in the child tree
     */
    KNode.prototype.getMaxChildTreeDepth = function () {
      var maxDepth = 0;
      for (var i=0; i < this._children.length; i++) {
        var depth;
        if (this._children[i].hasChildren()) {
          depth = this._children[i].getMaxChildTreeDepth() + 1;
        } else {
          depth = 1;
        }
        if (depth > maxDepth) maxDepth = depth;
      }
      return maxDepth;
    }

    KNode.prototype.getNodeProperties = function () {
      return this._props;
    }

    KNode.prototype.accept = function (visitor) {
      visitor.visitNode(this);
    }

    return KNode;
  }
);