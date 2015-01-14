var Class = require('pseudoclass');

/**
 * Created by leiko on 27/01/14.
 */
var Alert = Class({
    toString: 'Alert',

    construct: function (type) {
        this.timeout = null;
        this.type = type || 'success';
    },

    /**
     * 
     * @param title [optional]
     * @param content
     */
    setText: function (title, content) {
        if (!content) {
            content = title;
            title = null;
        }
        var popup = $('#alert');
        var popupTemplate = templates['alert'].render({
            title: title,
            content: content,
            type: this.type
        });

        if (popup.length !== 0) $('#alert').remove();
        $('body').append(popupTemplate);
    },

    /**
     *
     * @param title Popup title
     * @param html [optional]
     */
    setHTML: function (title, html) {
        var popup = $('#alert');
        var popupTemplate = templates['alert'].render({
            title: title,
            html: html,
            type: this.type
        });

        if (popup.length !== 0) $('#alert').remove();
        $('body').append(popupTemplate);
    },

    /**
     * 
     * @param type {'success', 'warning', 'danger', 'info', 'primary'}
     */
    setType: function (type) {
      this.type = type;
    },

    show: function (timeout) {
        var popup = $('#alert');
        if (timeout) {
            popup.removeClass('hide');
            clearTimeout(this.timeout);
            this.timeout = setTimeout(function () {
                popup.fadeOut(200, function () {
                    $(this).remove();
                });
            }.bind(this), timeout);
        } else {
            popup.removeClass('hide');
        }
    },
    
    hide: function () {
        clearTimeout(this.timeout);
        $('#alert').fadeOut(200, function () {
            $(this).remove();
        });
    }
});

exports = module.exports = Alert;
exports.WARNING = 'warning';
exports.DANGER = 'danger';
exports.INFO = 'info';
exports.PRIMARY = 'primary';