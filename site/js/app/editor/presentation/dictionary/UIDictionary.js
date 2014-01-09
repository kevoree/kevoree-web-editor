define(
  [
      'templates/attribute'
  ],
  function (attributeTemplate) {
    function UIDictionary(ctrl) {
      this._ctrl = ctrl;
    }

    UIDictionary.prototype.getHTML = function () {
      var generateAttributesHTML = function (isFragment) {
        var html = '';
        var attrs = this._ctrl.getEntity().getDictionaryAttributes();
        for (var i=0; i<attrs.length; i++) {
          var value = attrs[i].getDefaultValue();
          if (attrs[i].getFragmentDependant() === isFragment) {
            // check if there is a value already saved in the directory for this attribute
            var values = this._ctrl.getValues();
            for (var j=0; j < values.length; j++) {
              if (values[j].getName() == attrs[i].getName()) {
                value = values[j].getValue();
                break;
              }
            }
            html += attributeTemplate({
              node:           this._ctrl.getName(),
              name:           attrs[i].getName(),
              value:          value,
              type:           attrs[i].getType(),
              possibleValues: attrs[i].getPossibleValues(),
              selected:       attrs[i].getSelected(),
              optional:       attrs[i].getOptional()
            });
          }
        }
        return html;
      }.bind(this);

      if (this._ctrl.isFragment() === true) {
        return {
          name: this._ctrl.getName(),
          attributesHTML: generateAttributesHTML(true)
        };
      } else {
        return generateAttributesHTML(false);
      }
    }

    UIDictionary.prototype.onHTMLAppended = function () {
      for (var i=0; i < this._ctrl.getValues().length; i++) this._ctrl.getValues()[i].getUI().onHTMLAppended();
    }

    return UIDictionary;
  }
);