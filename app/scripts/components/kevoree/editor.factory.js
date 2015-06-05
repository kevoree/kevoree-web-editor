'use strict';

angular.module('editorApp')
    .factory('kEditor', function (kFactory, kModelHelper, kInstance, uiFactory) {

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

                this.model.addModelTreeListener({
                    elementChanged: modelReactor
                });

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
            var fragDic;
            if (trace.elementAttributeName === 'typeDefinitions' || trace.elementAttributeName === 'packages') {
                editor.listeners.forEach(function (listener) {
                    listener();
                });
            }

            if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE) {
                console.log('REMOVE', trace);
                if (trace.previousPath === '/') {
                    if (trace.elementAttributeName === 'hubs' ||
                        trace.elementAttributeName === 'nodes' ||
                        trace.elementAttributeName === 'groups') {
                        uiFactory.deleteInstance(trace.source, trace.previous_value); // jshint ignore:line
                    }
                } else {
                    if (trace.elementAttributeName === 'hosts' ||
                        trace.elementAttributeName === 'components') {
                        uiFactory.deleteInstance(trace.source, trace.previous_value); // jshint ignore:line

                    } else if (trace.elementAttributeName === 'groups') {
                        // means detaching a node from a group
                        uiFactory.deleteGroupWire(trace.previous_value, trace.previousPath); // jshint ignore:line
                        fragDic = trace.value.findFragmentDictionaryByID(trace.source.name);
                        if (fragDic) {
                            fragDic.delete();
                        }
                    }
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE_ALL) {
                console.log('REMOVE_ALL', trace);
                if (trace.previousPath === '/') {
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
                } else {
                    switch (trace.elementAttributeName) {
                        case 'groups':
                            trace.value.array.forEach(function (group) {
                                uiFactory.deleteGroupWire(group.path(), trace.previousPath);
                                var fragDic = group.findFragmentDictionaryByID(trace.source.name);
                                if (fragDic) {
                                    fragDic.delete();
                                }
                            });
                            break;

                        case 'bindings':
                            trace.value.array.forEach(function (binding) {
                                uiFactory.deleteBinding(binding.path());
                                if (!binding.hub || !binding.port) {
                                    binding.delete();
                                }
                            });
                            //uiFactory.deleteBindings(trace.previousPath);
                            // TODO check if there is at least one binding to this node, otherwise
                            // we can remove all fragmentDictionaries between those bindings' channels and nodes
                            break;
                    }
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.ADD) {
                console.log('ADD', trace);

                if (trace.previousPath === '/') {
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
                    }
                } else {
                    switch (trace.elementAttributeName) {
                        case 'groups':
                            uiFactory.createGroupWire(trace.value, trace.source);
                            break;

                        case 'components':
                            uiFactory.createComponent(trace.value);
                            trace.source.groups.array.forEach(function (group) {
                                uiFactory.createGroupWire(group, trace.source);
                            });

                            trace.value.provided.array.forEach(function (port) {
                                port.bindings.array.forEach(function (binding) {
                                    uiFactory.createBinding(binding);
                                });
                            });
                            trace.value.required.array.forEach(function (port) {
                                port.bindings.array.forEach(function (binding) {
                                    uiFactory.createBinding(binding);
                                });
                            });
                            break;

                        case 'hosts':
                            uiFactory.createNode(trace.value);
                            // update wires
                            trace.value.groups.array.forEach(function (group) {
                                uiFactory.createGroupWire(group, trace.source);
                            });
                            break;

                        case 'subNodes':
                            kInstance.initFragmentDictionaries(trace.source);
                            if (uiFactory.listener) {
                                var selected = uiFactory.editor.select('.selected');
                                if (selected) {
                                    uiFactory.listener(selected.parent().attr('data-path'));
                                }
                            }
                            break;
                    }
                }

            } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.SET) {
                switch (trace.elementAttributeName) {
                    case 'name':
                        if (trace.source.getRefInParent() === 'nodes') {
                            // update groups fragmentDictionaries
                            trace.source.groups.array.forEach(function (group) {
                                fragDic = group.findFragmentDictionaryByID(trace.previous_value); // jshint ignore:line
                                if (fragDic) {
                                    fragDic.name = trace.source.name;
                                }
                            });
                            // update bindings fragmentDictionaries
                            trace.source.components.array.forEach(function (comp) {
                                function processPort(port) {
                                    port.bindings.array.forEach(function (binding) {
                                        if (binding.hub) {
                                            fragDic = binding.hub.findFragmentDictionaryByID(trace.previous_value); // jshint ignore:line
                                            if (fragDic) {
                                                fragDic.name = trace.source.name;
                                            }
                                        }
                                    });
                                }

                                comp.provided.array.forEach(processPort);
                                comp.required.array.forEach(processPort);
                            });
                        }
                        console.log('SET handled', trace);
                        uiFactory.updateInstance(trace.previousPath, trace.source);
                        break;

                    case 'value':
                    case 'started':
                        console.log('SET handled', trace);
                        uiFactory.updateInstance(trace.previousPath, trace.source);
                        break;

                    case 'typeDefinition':
                        if (trace.value !== null) {
                            console.log('SET typeDef', trace);
                            uiFactory.updateCompTypeDefinition(trace.source, trace.previous_value); // jshint ignore:line
                        }
                        break;

                    default:
                        console.log('SET ignored', trace);
                        break;
                }
            }
        }



        return editor;
    });
