define(
    [
        'abstraction/dictionary/KAttribute',
        'control/AController',
        'presentation/dictionary/UIAttribute',
        'util/Pooffs'
    ],
    function (KAttribute, AController, UIAttribute, Pooffs) {

        Pooffs.extends(CAttribute, AController);
        Pooffs.extends(CAttribute, KAttribute);

        function CAttribute() {
            KAttribute.prototype.constructor.call(this);

            this._ui = new UIAttribute(this);
        }

        return CAttribute;
    }
);