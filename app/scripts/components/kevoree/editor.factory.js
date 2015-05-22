'use strict';

angular.module('editorApp')
    .factory('kEditor', function (kFactory, kModelHelper, uiFactory) {

        /**
         * Updates UI according to model changes
         * @param trace
         */
        function modelReactor(trace) {
            if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE) {
                if (trace.elementAttributeName === 'hubs' ||
                    trace.elementAttributeName === 'nodes' ||
                    trace.elementAttributeName === 'groups' ||
                    trace.elementAttributeName === 'components') {
                    uiFactory.deleteInstance(trace.source, trace.previous_value);
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.ADD) {
                switch (trace.elementAttributeName) {
                    case 'hubs':
                        uiFactory.createChannel(trace.value);
                        break;

                    case 'nodes':
                        uiFactory.createNode(trace.value);
                        break;

                    case 'groups':
                        uiFactory.createGroup(trace.value);
                        break;

                    case 'components':
                        uiFactory.createComponent(trace.value);
                        break;
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.SET) {
                console.log('set', trace);
                uiFactory.updateInstance(trace.previousPath, trace.source);
            }
        }

        function KevoreeEditor() {
            this.model = kFactory.createContainerRoot();
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
