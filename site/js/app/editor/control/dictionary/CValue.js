define(
    [
        'abstraction/dictionary/KValue',
        'control/AController',
        'presentation/dictionary/UIValue',
        'util/Pooffs'
    ],
    function (KValue, AController, UIValue, Pooffs) {

        Pooffs.extends(CValue, AController);
        Pooffs.extends(CValue, KValue);

        function CValue() {
            KValue.prototype.constructor.call(this);

            this._ui = new UIValue(this);
        }

      CValue.prototype.p2cSaveValue = function () {
        this.setValue(this._ui.getValue());
      }

        return CValue;
    }
);