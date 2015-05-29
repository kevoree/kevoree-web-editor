'use strict';

angular.module('editorApp')
    .factory('kEditor', function (kFactory, kModelHelper, uiFactory) {

        function KevoreeEditor() {
            this.model = kFactory.createContainerRoot();
            this.listeners = [];

            uiFactory.setModel(this.model);
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

                this.model.addModelElementListener({
                    elementChanged: modelReactor
                });

                var visitor = new KevoreeLibrary.modeling.api.util.ModelVisitor();
                visitor.visit = function (elem, ref) {
                    if (ref === 'nodes' ||
                        ref === 'groups' ||
                        ref === 'components' ||
                        ref === 'hubs' ||
                        ref === 'packages' ||
                        ref === 'typeDefinitions') {
                        elem.addModelElementListener({ elementChanged: modelReactor });
                    }
                };
                this.model.visit(visitor, true, true, false);

                uiFactory.setModel(model);

                this.listeners.forEach(function (listener) {
                    listener();
                });
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
            }
        };

        var editor = new KevoreeEditor();

        /**
         * Updates UI according to model changes
         * @param trace
         */
        function modelReactor(trace) {
            if (trace.elementAttributeName === 'typeDefinitions' || trace.elementAttributeName === 'packages') {
                editor.listeners.forEach(function (listener) {
                    listener();
                });
            }

            if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE) {
                console.log('REMOVE', trace);
                if (trace.elementAttributeName === 'hubs' ||
                    trace.elementAttributeName === 'nodes' ||
                    trace.elementAttributeName === 'groups' ||
                    trace.elementAttributeName === 'hosts' ||
                    trace.elementAttributeName === 'components') {
                    uiFactory.deleteInstance(trace.source, trace.previous_value); // jshint ignore:line
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE_ALL) {
                switch (trace.elementAttributeName) {
                    case 'hubs':
                        uiFactory.deleteChannels();
                        break;

                    case 'nodes':
                        uiFactory.deleteNodes();
                        break;

                    case 'groups':
                        uiFactory.deleteGroups();
                        break;

                    case 'mBindings':
                        uiFactory.deleteBindings();
                        break;
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.ADD) {
                console.log('ADD', trace);
                trace.value.addModelElementListener({ elementChanged: modelReactor });

                switch (trace.elementAttributeName) {
                    case 'hubs':
                        uiFactory.createChannel(trace.value);
                        break;

                    case 'nodes':
                    case 'hosts':
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
                console.log('SET', trace);
                uiFactory.updateInstance(trace.previousPath, trace.source);
            }
        }

        return editor;
    });
