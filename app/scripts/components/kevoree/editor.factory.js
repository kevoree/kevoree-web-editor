'use strict';

angular.module('editorApp')
    .factory('kEditor', function (kFactory, kModelHelper, uiFactory) {
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

        var editor = new KevoreeEditor();

        function modelReactor(trace) {
            if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE) {
                if (trace.elementAttributeName === 'hubs' ||
                    trace.elementAttributeName === 'nodes' ||
                    trace.elementAttributeName === 'groups' ||
                    trace.elementAttributeName === 'components') {
                    uiFactory.deleteInstance(trace.previous_value);
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.ADD) {
                console.log('add', trace);
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

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE_ALL) {
                console.log('remove all', trace.value);
            }
        }

        return editor;
    });
