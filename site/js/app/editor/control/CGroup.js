define(
  [
    'abstraction/KGroup',
    'presentation/UIGroup',
    'control/AController',
    'control/CEntity',
    'lib/kevoree',
    'util/Pooffs'
  ],

  function(KGroup, UIGroup, AController, CEntity, Kevoree, Pooffs) {

    Pooffs.extends(CGroup, AController);
    Pooffs.extends(CGroup, KGroup);
    Pooffs.extends(CGroup, CEntity);

    function CGroup(editor, type, version) {
      // KGroup.super(type)
      KGroup.prototype.constructor.call(this, editor, type, version);

      // CEntity.super(editor, type)
      CEntity.prototype.constructor.call(this, editor, type, version);

      // instantiate UI
      this._ui = new UIGroup(this);
    }

    // Override CEntity.p2cMouseDown()
    CGroup.prototype.p2cMouseDown = function (position) {
      // user starts the creation of a wire
      var wire = this.createWire();

      // tell editor that we have started a new wire task
      this.getEditor().startWireCreationTask(wire);

      // give the ui the newly created wire's UI
      this._ui.c2pWireCreationStarted(wire.getUI());
    }

    // CEntity is extended after KGroup which means that disconnect method
    // is in reality the one given by KEntity, but that's not what we want!
    // So this is the "hack" that makes it work
    CGroup.prototype.disconnect = function (wire) {
      KGroup.prototype.disconnect.call(this, wire);
    }

    return CGroup;
  }
);