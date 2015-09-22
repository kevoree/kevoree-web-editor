'use strict';

angular.module('editorApp')
    .factory('kEditor', function (kFactory, kModelHelper, kInstance, ui, Notification, KWE_POSITION) {

        function KevoreeEditor() {
            this.model = kFactory.createContainerRoot();
            kFactory.root(this.model);
            this.listeners = [];
            this.modelListener = {
                elementChanged: modelReactor
            };

            ui.setModel(this.model);
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
                kFactory.root(this.model);

                this.model.addModelTreeListener(this.modelListener);

                ui.setModel(model);
                this.drawModel();

                this.listeners.forEach(function (listener) {
                    listener();
                });
            },

            /**
             *
             * @param model
             */
            merge: function (model) {
                this.model.removeModelTreeListener(this.modelListener);
                var compare = kFactory.createModelCompare();
                compare.merge(this.model, model).applyOn(this.model);
                kFactory.root(this.model);
                this.model.addModelTreeListener(this.modelListener);
                ui.setModel(this.model);
                this.drawModel();
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
             * Try to find a better position for each instances in order to prevent
             * UI overlapping in editor
             */
            fixOverlapping: function () {
                function relocate(instance, pos) {
                    var meta = instance.findMetaDataByID(KWE_POSITION);
                    if (!meta) {
                        meta = kFactory.createValue();
                        meta.name = KWE_POSITION;
                        meta.value = JSON.stringify(pos);
                        instance.addMetaData(meta);
                    } else {
                        meta.value = JSON.stringify(pos);
                    }
                }

                var groupX = 75;
                this.model.groups.array.forEach(function (group) {
                    relocate(group, { x: groupX, y: 75 });
                    groupX += 140;
                });

                var nodeX = 25;
                this.model.nodes.array.forEach(function (node) {
                    if (!node.host) {
                        // root node (= no parent)
                        var height = kModelHelper.getNodeTreeHeight(node);
                        relocate(node, { x: nodeX, y: 150 });
                        nodeX += 230 + (height * 20);
                    }
                });

                var chanX = 75;
                this.model.hubs.array.forEach(function (hub) {
                    relocate(hub, { x: chanX, y: 550 });
                    chanX += 120;
                });
            },

            /**
             * Create svg UIs based on current model
             */
            drawModel: function () {
                this.model.hubs.array.forEach(function (instance) {
                    ui.createChannel(instance);
                });

                this.model.nodes.array
                    .sort(function (a, b) {
                        // TODO optimize this to loop only once to create node tree heights
                        return kModelHelper.getNodeTreeHeight(b) - kModelHelper.getNodeTreeHeight(a);
                    })
                    .forEach(function (instance) {
                        ui.createNode(instance);
                        instance.components.array.forEach(function (instance) {
                            ui.createComponent(instance);
                        });
                    });

                this.model.groups.array.forEach(function (instance) {
                    ui.createGroup(instance);

                    instance.subNodes.array.forEach(function (node) {
                        ui.createGroupWire(instance, node);
                    });
                });

                this.model.mBindings.array.forEach(function (binding) {
                    ui.createBinding(binding);
                });
            }
        };

        var editor = new KevoreeEditor();

        /**
         * Updates UI according to model changes
         * @param trace
         */
        function modelReactor(trace) {
            var fragDic, selected, highestNode;

            function processRefreshRecursively(node) {
                node.components.array.forEach(processComponent);
                node.groups.array.forEach(function (group) {
                    ui.createGroupWire(group, node);
                });
                node.hosts.array.forEach(processRefreshRecursively);
            }

            function processComponent(comp) {
                comp.provided.array.forEach(processPort);
                comp.required.array.forEach(processPort);
            }

            function processPort(port) {
                port.bindings.array.forEach(function (binding) {
                    ui.createBinding(binding);
                });
            }

            if (trace.elementAttributeName === 'typeDefinitions' || trace.elementAttributeName === 'packages') {
                editor.listeners.forEach(function (listener) {
                    listener();
                });
            }

            try {
                if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE) {
                    //console.log('REMOVE', trace);
                    if (trace.previousPath === '/') {
                        if (trace.elementAttributeName === 'hubs' ||
                            trace.elementAttributeName === 'nodes' ||
                            trace.elementAttributeName === 'groups') {
                            ui.deleteInstance(trace.source, trace.previous_value); // jshint ignore:line
                        } else if (trace.elementAttributeName === 'mBindings') {
                            ui.deleteBinding(trace.previous_value); // jshint ignore:line
                        }
                    } else {
                        if (trace.elementAttributeName === 'hosts' ||
                            trace.elementAttributeName === 'components') {
                            ui.deleteInstance(trace.source, trace.previous_value); // jshint ignore:line

                        } else if (trace.elementAttributeName === 'groups') {
                            // means detaching a node from a group
                            ui.deleteGroupWire(trace.previous_value, trace.previousPath); // jshint ignore:line
                            fragDic = trace.value.findFragmentDictionaryByID(trace.source.name);
                            if (fragDic) {
                                fragDic.delete();
                            }
                        } else if (trace.elementAttributeName === 'bindings') {
                            if (trace.source.getRefInParent() === 'hubs') {
                                trace.source.fragmentDictionary.array.forEach(function (dic) {
                                    var hasBinding = false;

                                    // check if there is a binding for this dictionnary
                                    for (var i=0; i < trace.source.bindings.size(); i++) {
                                        var binding = trace.source.bindings.get(i);
                                        if (binding.port) {
                                            if (binding.port.eContainer().eContainer().name === dic.name) {
                                                hasBinding = true;
                                                break;
                                            }
                                        }
                                    }

                                    if (!hasBinding) {
                                        // no binding found for this dictionary => delete it
                                        dic.delete();
                                    }
                                });
                            }
                        }
                    }

                } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE_ALL) {
                    //console.log('REMOVE_ALL', trace);
                    if (trace.previousPath === '/') {
                        switch (trace.elementAttributeName) {
                            case 'hubs':
                                ui.deleteChannels();
                                break;

                            case 'nodes':
                                ui.deleteNodes();
                                break;

                            case 'groups':
                                ui.deleteGroups();
                                break;

                            case 'mBindings':
                                ui.deleteBindings();
                                break;
                        }
                    } else {
                        switch (trace.elementAttributeName) {
                            case 'groups':
                                trace.value.array.forEach(function (group) {
                                    ui.deleteGroupWire(group.path(), trace.previousPath);
                                    var fragDic = group.findFragmentDictionaryByID(trace.source.name);
                                    if (fragDic) {
                                        fragDic.delete();
                                    }
                                });
                                break;

                            case 'bindings':
                                trace.value.array.forEach(function (binding) {
                                    ui.deleteBinding(binding.path());
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
                    //console.log('ADD', trace);
                    if (trace.previousPath === '/') {
                        switch (trace.elementAttributeName) {
                            case 'hubs':
                                //console.log('ADD hubs', trace);
                                ui.createChannel(trace.value);
                                break;

                            case 'nodes':
                            case 'hosts':
                                //console.log('ADD nodes|hosts', trace);
                                ui.createNode(trace.value);
                                ui.refreshNode(kModelHelper.getHighestNode(trace.value).path());
                                break;

                            case 'groups':
                                //console.log('ADD groups', trace);
                                ui.createGroup(trace.value);
                                break;

                            case 'mBindings':
                                //console.log('ADD mBinding', trace);
                                ui.createBinding(trace.value);
                                break;
                        }
                    } else {
                        switch (trace.elementAttributeName) {
                            case 'groups':
                                //console.log('ADD .groups', trace);
                                ui.createGroupWire(trace.value, trace.source);
                                break;

                            case 'components':
                                //console.log('ADD .components', trace);
                                ui.createComponent(trace.value);

                                highestNode = kModelHelper.getHighestNode(trace.value);
                                ui.refreshNode(highestNode.path());
                                processRefreshRecursively(highestNode);
                                break;

                            case 'hosts':
                                //console.log('ADD .hosts', trace.source.path(), trace.value.path());
                                ui.createNode(trace.value);

                                // recursively recreate children UIs
                                trace.value.components.array.forEach(function (comp) {
                                    ui.createComponent(comp);
                                });
                                trace.value.hosts.array
                                    .sort(function (a, b) {
                                        // TODO optimize this to loop only once to create node tree heights
                                        return kModelHelper.getNodeTreeHeight(b) - kModelHelper.getNodeTreeHeight(a);
                                    })
                                    .forEach(function updateChildNode(childNode) {
                                        ui.createNode(childNode);
                                        childNode.components.array.forEach(function (comp) {
                                            ui.createComponent(comp);
                                        });
                                        childNode.hosts.array.forEach(updateChildNode);
                                    });

                                highestNode = kModelHelper.getHighestNode(trace.source);
                                ui.refreshNode(highestNode.path());
                                processRefreshRecursively(highestNode);
                                break;

                            case 'subNodes':
                                //console.log('ADD .subNodes', trace);
                                kInstance.initFragmentDictionaries(trace.source);
                                selected = ui.getSelected();
                                if (selected.length === 1 && (selected[0].attr('data-path') === trace.source.path())) {
                                    ui.invokeListener(trace.source.path());
                                }
                                break;

                            case 'bindings':
                                if (trace.source.getRefInParent() === 'hubs') {
                                    selected = ui.getSelected();
                                    if (selected.length === 1 && (selected[0].attr('data-path') === trace.source.path())) {
                                        ui.invokeListener(trace.source.path());
                                    }
                                }
                                break;
                        }
                    }

                } else if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.SET) {
                    switch (trace.elementAttributeName) {
                        case 'name':
                            //console.log('SET name', trace);
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
                            ui.updateInstance(trace.previousPath, trace.source);
                            break;

                        case 'value':
                            //console.log('SET value', trace);
                            if (trace.source.getRefInParent() === 'metaData' && trace.source.name === KWE_POSITION) {
                                ui.updatePosition(trace.source.eContainer());
                                if (trace.source.eContainer().getRefInParent() === 'nodes') {
                                    processRefreshRecursively(trace.source.eContainer());
                                } else if (trace.source.eContainer().getRefInParent() === 'groups') {
                                    trace.source.eContainer().subNodes.array.forEach(function (node) {
                                        ui.createGroupWire(trace.source.eContainer(), node);
                                    });
                                } else if (trace.source.eContainer().getRefInParent() === 'hubs') {
                                    trace.source.eContainer().bindings.array.forEach(function (binding) {
                                        ui.createBinding(binding);
                                    });
                                }
                            }
                            break;

                        case 'started':
                            //console.log('SET started', trace);
                            ui.updateInstance(trace.previousPath, trace.source);
                            break;

                        case 'typeDefinition':
                            if (trace.value !== null) {
                                switch (trace.source.getRefInParent()) {
                                    case 'components':
                                        //console.log('SET typeDef', trace);
                                        ui.updateCompTypeDefinition(trace.source, trace.previous_value); // jshint ignore:line
                                        break;

                                    default:
                                        //console.log('SET typeDef unhandled', trace);
                                        break;
                                }
                            }
                            break;

                        default:
                            //console.log('SET ignored', trace);
                            break;
                    }
                }
            } catch (err) {
                Notification.error({
                    title: 'Error',
                    message: 'Unable to update model'
                });
                console.error(err.stack);
            }
        }

        return editor;
    });
