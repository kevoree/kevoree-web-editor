'use strict';

angular.module('editorApp')
    .factory('kEditor', function (modelReactor) {
        var factory = new KevoreeLibrary.factory.DefaultKevoreeFactory();

        function KevoreeEditor() {
            this.model = factory.createContainerRoot();
            this.listeners = [];
            this.draggedElem = null;
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

                this.model.addModelElementListener({
                    elementChanged: modelReactor
                });

                var visitor = new KevoreeLibrary.modeling.api.util.ModelVisitor();
                visitor.visit = function (elem, ref) {
                    if (ref === 'nodes' || ref === 'groups' || ref === 'components' || ref === 'hubs') {
                        elem.addModelElementListener({ elementChanged: modelReactor });
                    }
                };
                this.model.visit(visitor, true, true, false);
            },

            /**
             * Add listener that will be invoked on each call to setModel()
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
            },

            /**
             *
             * @param elem
             */
            setDraggedElem: function (elem) {
                this.draggedElem = elem;
            },

            /**
             *
             * @returns {null|*}
             */
            getDraggedElem: function () {
                return this.draggedElem;
            }
        };

        return new KevoreeEditor();
    });
