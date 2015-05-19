'use strict';

angular.module('editorApp')
    .factory('kEditor', function () {
        var factory = new KevoreeLibrary.factory.DefaultKevoreeFactory();

        function KevoreeEditor() {
            this.model = factory.createContainerRoot();
            this.listeners = [];
        }

        KevoreeEditor.prototype = {
            /**
             *
             * @returns {*}
             */
            getModel: function () {
                return this.model;
            },
            /**
             *
             * @param model
             */
            setModel: function (model) {
                this.model = model;
                this.listeners.forEach(function (listener) {
                    listener();
                });
            },

            /**
             *
             * @param {Function} listener
             */
            addListener: function (listener) {
                if (this.listeners.indexOf(listener) === -1) {
                    this.listeners.push(listener);
                }
            },

            /**
             *
             * @param {Function} listener
             */
            removeListener: function (listener) {
                this.listeners.splice(this.listeners.indexOf(listener), 1);
            }
        };

        return new KevoreeEditor();
    });
