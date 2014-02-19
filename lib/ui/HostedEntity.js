var AbstractEntity = require('./AbstractEntity');

/**
 * Created by leiko on 03/02/14.
 */
var HostedEntity = AbstractEntity.extend({
    toString: 'HostedEntity',
    
    setWidth: function (width) {
        if (this.text && this.bgRect && this.border) {
            this.text.setWidth(width);
            this.bgRect.setWidth(width);
            this.border.setWidth(width);
        }
    },

    setHeight: function (height) {
        if (this.text && this.bgRect && this.border) {
            this.text.offsetY(-(height/2 - this.text.getHeight()/2));
            this.bgRect.setHeight(height);
            this.border.setHeight(height);      
        }
    },

    getWidth: function () {
        return (this.bgRect) ? this.bgRect.getWidth() : 0;
    },

    getHeight: function () {
        return (this.bgRect) ? this.bgRect.getHeight() : 0;
    },

    setX: function (x) {
        this.shape.setX(x);
    },

    setY: function (y) {
        this.shape.setY(y);
    }
});

module.exports = HostedEntity;
