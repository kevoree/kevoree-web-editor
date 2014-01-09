define(
  [
    'templates/instance-properties'
  ],
  function (instancePropertiesTemplate) {
    var NAMESPACE = '.instance-properties';

    function UIInstanceProps(ctrl) {
      this._ctrl = ctrl;
    }

    UIInstanceProps.prototype.onDeleteInstance = function () {
      this._ctrl.p2cRemoveEntity();
    }

    UIInstanceProps.prototype.onSaveProperties = function () {
      // tell controller that user wants to save properties
      this._ctrl.p2cSaveProperties(this.getPropertiesValues());
    }

    UIInstanceProps.prototype.getPropertiesValues = function () {
      return { name: $('#instance-attr-name').val() };
    }

    UIInstanceProps.prototype.show = function () {
      var that = this;
      $('#prop-popup-delete').off('click'+NAMESPACE); // get rid of old listeners on '#delete'
      $('#prop-popup-delete').on('click'+NAMESPACE, function() {
        that.onDeleteInstance();
      });

      $('#prop-popup-save').off('click'+NAMESPACE);
      $('#prop-popup-save').on('click'+NAMESPACE, function () {
        if (!$(this).hasClass('disabled')) {
          that.onSaveProperties();
          that._ctrl.getDictionary().p2cSaveDictionary();
          if (that._ctrl.getFragmentDictionaries) {
            for (var i=0; i < that._ctrl.getFragmentDictionaries().length; i++) {
              that._ctrl.getFragmentDictionaries()[i].p2cSaveDictionary();
            }
          }
        }
      });

      $('#prop-popup-subtitle').html(this._ctrl.getEntityType());
      $('#instance-prop-name').val(this._ctrl.getName());
      $('#prop-popup-content').html(this.getHTML());
      this.onHTMLAppended();
      $('#prop-popup').modal({ show: true });
    }

    UIInstanceProps.prototype.getHTML = function () {
      var fragments = [];
      if (this._ctrl.getFragmentDictionaries) {
        for (var i=0; i<this._ctrl.getFragmentDictionaries().length; i++) {
          fragments.push(this._ctrl.getFragmentDictionaries()[i].getUI().getHTML());
        }
      }

      var options = {
        name: this._ctrl.getName(),
        dictionary: this._ctrl.getDictionary().getUI().getHTML(),
        fragments: fragments
      };
      
      return instancePropertiesTemplate(options);
    }

    UIInstanceProps.prototype.onHTMLAppended = function () {
      this._ctrl.getDictionary().getUI().onHTMLAppended();
      if (this._ctrl.getFragmentDictionaries) {
        for (var i=0; i<this._ctrl.getFragmentDictionaries().length; i++) {
          this._ctrl.getFragmentDictionaries()[i].getUI().onHTMLAppended();
        }
      }
    }

    return UIInstanceProps;
  }
);