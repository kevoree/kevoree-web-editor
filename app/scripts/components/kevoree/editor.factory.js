'use strict';

angular.module('editorApp').factory('kEditor', function($timeout, kFactory, kModelHelper, kInstance, ui, Notification, KWE_POSITION, KWE_FOLDED, KWE_SELECTED, KWE_TAG, CHANNEL_RADIUS, GROUP_RADIUS) {
	function modelReactor(editor) {
		/**
       * Updates UI according to model changes
       * @param trace
       */
		return function (trace) {
			var fragDic,
				highestNode;
			editor.invokeModelUpdateListeners();

			function processRefreshRecursively(node) {
				node.components.array.forEach(function(comp) {
					comp.provided.array.forEach(function(port) {
						port.bindings.array.forEach(function(binding) {
							if (ui.editor) {
								ui.createBinding(binding);
							}
						});
					});
					comp.required.array.forEach(function(port) {
						port.bindings.array.forEach(function(binding) {
							if (ui.editor) {
								ui.createBinding(binding);
							}
						});
					});
				});
				node.groups.array.forEach(function(group) {
					if (ui.editor) {
						ui.createGroupWire(group, node);
					}
				});
				node.hosts.array.forEach(processRefreshRecursively);
			}

			if (trace.elementAttributeName === 'typeDefinitions' || trace.elementAttributeName === 'packages') {
				editor.invokeModelUpdateListeners('tdefs');
			}

			try {
				if (trace.etype === KevoreeLibrary.modeling.api.util.ActionType.object.REMOVE) {
					//console.log('REMOVE', trace);
					if (trace.previousPath === '/') {
						if (trace.elementAttributeName === 'hubs' || trace.elementAttributeName === 'nodes' || trace.elementAttributeName === 'groups') {
							if (ui.editor) {
								ui.deleteInstance(trace.source, trace.previous_value); // jshint ignore:line
							}
							editor.invokeModelUpdateListeners('selected');
						} else if (trace.elementAttributeName === 'mBindings') {
							if (ui.editor) {
								ui.deleteBinding(trace.previous_value); // jshint ignore:line
							}
						}
					} else {
						if (trace.elementAttributeName === 'hosts' || trace.elementAttributeName === 'components') {
							if (ui.editor) {
								ui.deleteInstance(trace.source, trace.previous_value); // jshint ignore:line
							}
							editor.invokeModelUpdateListeners('selected');

						} else if (trace.elementAttributeName === 'groups') {
							// means detaching a node from a group
							if (ui.editor) {
								ui.deleteGroupWire(trace.previous_value, trace.previousPath); // jshint ignore:line
							}
							fragDic = trace.value.findFragmentDictionaryByID(trace.source.name);
							if (fragDic) {
								fragDic.delete();
							}
						} else if (trace.elementAttributeName === 'bindings') {
							if (trace.source.getRefInParent() === 'hubs') {
								trace.source.fragmentDictionary.array.forEach(function(dic) {
									var hasBinding = false;

									// check if there is a binding for this dictionnary
									for (var i = 0; i < trace.source.bindings.size(); i++) {
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
								if (ui.editor) {
									ui.deleteChannels();
								}
								break;

							case 'nodes':
								if (ui.editor) {
									ui.deleteNodes();
								}
								break;

							case 'groups':
								if (ui.editor) {
									ui.deleteGroups();
								}
								break;

							case 'mBindings':
								if (ui.editor) {
									ui.deleteBindings();
								}
								break;
						}
					} else {
						switch (trace.elementAttributeName) {
							case 'groups':
								trace.value.array.forEach(function(group) {
									if (ui.editor) {
										ui.deleteGroupWire(group.path(), trace.previousPath);
									}
									var fragDic = group.findFragmentDictionaryByID(trace.source.name);
									if (fragDic) {
										fragDic.delete();
									}
								});
								break;

							case 'bindings':
								trace.value.array.forEach(function(binding) {
									if (ui.editor) {
										ui.deleteBinding(binding.path());
									}
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
								if (ui.editor) {
									ui.createChannel(trace.value);
								}
								break;

							case 'nodes':
							case 'hosts':
								//console.log('ADD nodes|hosts', trace);
								if (ui.editor) {
									ui.createNode(trace.value);
									highestNode = kModelHelper.getHighestNode(trace.value);
									if (highestNode) {
										ui.refreshNode(highestNode.path());
									}
								}
								break;

							case 'groups':
								//console.log('ADD groups', trace);
								if (ui.editor) {
									ui.createGroup(trace.value);
								}
								break;

							case 'mBindings':
								//console.log('ADD mBinding', trace);
								if (ui.editor) {
									ui.createBinding(trace.value);
								}
								break;
						}
					} else {
						switch (trace.elementAttributeName) {
							case 'groups':
								//console.log('ADD .groups', trace);
								if (ui.editor) {
									ui.createGroupWire(trace.value, trace.source);
								}
								break;

							case 'components':
								//console.log('ADD .components', trace);
								if (ui.editor) {
									ui.createComponent(trace.value);
								}

								highestNode = kModelHelper.getHighestNode(trace.value);
								if (ui.editor) {
									ui.refreshNode(highestNode.path());
								}
								processRefreshRecursively(highestNode);
								break;

							case 'hosts':
								//console.log('ADD .hosts', trace.source.path(), trace.value.path());
								if (ui.editor) {
									ui.createNode(trace.value);
								}

								// recursively recreate children UIs
								trace.value.components.array.forEach(function(comp) {
									if (ui.editor) {
										ui.createComponent(comp);
									}
								});
								trace.value.hosts.array.sort(function(a, b) {
									// TODO optimize this to loop only once to create node tree heights
									return kModelHelper.getNodeTreeHeight(b) - kModelHelper.getNodeTreeHeight(a);
								}).forEach(function updateChildNode(childNode) {
									if (ui.editor) {
										ui.createNode(childNode);
									}
									childNode.components.array.forEach(function(comp) {
										if (ui.editor) {
											ui.createComponent(comp);
										}
									});
									childNode.hosts.array.forEach(updateChildNode);
								});

								highestNode = kModelHelper.getHighestNode(trace.source);
								if (ui.editor) {
									ui.refreshNode(highestNode.path());
								}
								processRefreshRecursively(highestNode);
								break;

							case 'subNodes':
								//console.log('ADD .subNodes', trace);
								kInstance.initFragmentDictionaries(trace.source);
								editor.invokeModelUpdateListeners('selected');
								break;

							case 'bindings':
								editor.invokeModelUpdateListeners('selected');
								break;

							case 'metaData':
								if (trace.value.name === KWE_FOLDED && trace.source.getRefInParent() === 'nodes') {
									if (ui.editor) {
										ui.toggleFold(trace.source, kModelHelper.isTruish(trace.value.value));
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
								trace.source.groups.array.forEach(function(group) {
									fragDic = group.findFragmentDictionaryByID(trace.previous_value); // jshint ignore:line
									if (fragDic) {
										fragDic.name = trace.source.name;
									}
								});
								// update bindings fragmentDictionaries
								trace.source.components.array.forEach(function(comp) {
									function processPort(port) {
										port.bindings.array.forEach(function(binding) {
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
							if (ui.editor) {
								ui.updateInstance(trace.previousPath, trace.source);
							}
							break;

						case 'value':
							// console.log('SET value', trace);
							if (trace.source.getRefInParent() === 'metaData' && trace.source.name === KWE_POSITION) {
								if (ui.editor) {
									ui.updatePosition(trace.source.eContainer());
								}
								if (trace.source.eContainer().getRefInParent() === 'nodes') {
									processRefreshRecursively(trace.source.eContainer());
								} else if (trace.source.eContainer().getRefInParent() === 'groups') {
									trace.source.eContainer().subNodes.array.forEach(function(node) {
										if (ui.editor) {
											ui.createGroupWire(trace.source.eContainer(), node);
										}
									});
								} else if (trace.source.eContainer().getRefInParent() === 'hubs') {
									trace.source.eContainer().bindings.array.forEach(function(binding) {
										if (ui.editor) {
											ui.createBinding(binding);
										}
									});
								}
							} else if (trace.source.getRefInParent() === 'metaData' && trace.source.name === KWE_FOLDED) {
								// fold/unfold
								if (trace.source.eContainer().getRefInParent() === 'nodes') {
									if (ui.editor) {
										ui.toggleFold(trace.source.eContainer(), kModelHelper.isTruish(trace.source.value));
									}
								}
							} else if (trace.source.eContainer().getRefInParent() === 'dictionary') {
								if (ui.editor) {
									ui.updateValidity(trace.source.eContainer().eContainer());
								}
							} else if (trace.source.getRefInParent() === 'metaData' && trace.source.name === KWE_SELECTED) {
								editor.invokeModelUpdateListeners('selected');
							}
							break;

						case 'started':
							//console.log('SET started', trace);
							if (ui.editor) {
								ui.updateInstance(trace.previousPath, trace.source);
							}
							break;

						case 'typeDefinition':
							if (trace.value !== null) {
								switch (trace.source.getRefInParent()) {
									case 'components':
										//console.log('SET typeDef', trace);
										if (ui.editor) {
											ui.updateCompTypeDefinition(trace.source, trace.previous_value); // jshint ignore:line
										}
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
				console.error(err.stack); // eslint-disable-line
			}
		};
	}

	function KevoreeEditor() {
		this.model = kFactory.createContainerRoot().withGenerated_KMF_ID(0);
		kFactory.root(this.model);
		this.preSetModelHandler = [];
		this.postSetModelHandler = [];
		this.modelUpdateListenersEnabled = true;
		this.modelUpdateListeners = [];
		this.newModelListeners = [];
		this.modelListener = {
			elementChanged: modelReactor(this)
		};
		ui.setModel(this.model);
	}

	KevoreeEditor.prototype = {
		/**
       *
       * @returns {*}
       */
		getModel: function() {
			return this.model;
		},

		/**
       *
       * @param model
       */
		setModel: function(model, callback) {
			this.preSetModelHandler.forEach(function(handler) {
				handler();
			});
			setTimeout(function() {
				var error;
				try {
					KevoreeValidator(model); // jshint ignore:line
					this.model = model;
					kFactory.root(this.model);

					this.model.addModelTreeListener(this.modelListener);

					ui.setModel(model);

					this.invokeNewModelListeners();
				} catch (err) {
					error = err;
				} finally {
					if (error) {
						console.error('[editor.factory.setModel()] Error setting model'); // eslint-disable-line
						console.error(error.stack); // eslint-disable-line
					}
					this.postSetModelHandler.forEach(function(handler) {
						handler();
					});
					if (callback) {
						$timeout(angular.noop, 100).then(function() {
							callback(error);
						});
					}
				}
			}.bind(this), 20);
		},

		/**
       *
       * @param model
       */
		merge: function(model) {
			this.model.removeModelTreeListener(this.modelListener);
			var compare = kFactory.createModelCompare();
			compare.merge(this.model, model).applyOn(this.model);
			kFactory.root(this.model);
			this.model.addModelTreeListener(this.modelListener);
			ui.setModel(this.model);
			this.drawModel();
		},

		addPreSetModelHandler: function(handler) {
			var index = this.preSetModelHandler.push(handler) - 1;
			return function() {
				this.preSetModelHandler.splice(index, 1);
			}.bind(this);
		},

		addPostSetModelHandler: function(handler) {
			var index = this.postSetModelHandler.push(handler) - 1;
			return function() {
				this.postSetModelHandler.splice(index, 1);
			}.bind(this);
		},

		/**
       * Add a listener that will be invoked each time a new model is set
       * @param {string} id
       * @param {Function} listener
       * @returns {Function} unregister listener
       */
		addNewModelListener: function(id, listener) {
			if (!this.newModelListeners[id]) {
				this.newModelListeners[id] = [];
			}
			this.newModelListeners[id].push(listener);

			return function() {
				if (this.newModelListeners[id]) {
					this.newModelListeners[id].splice(this.newModelListeners[id].indexOf(listener), 1);
				}
			}.bind(this);
		},

		/**
       * Add listener that will be invoked on each update of the model
       * @param {string} id
       * @param {Function} listener
       * @param {boolean} strict optional flag that will prevent this
       *                  listener to be called unless the invoke method
       *                  is called using this precise id as event name
       * @returns {Function} unregister listener
       */
		addModelUpdateListener: function(id, listener, strict) {
			if (!this.modelUpdateListeners[id]) {
				this.modelUpdateListeners[id] = [];
			}
			var item = {
				strict: strict,
				listener: listener
			};
			this.modelUpdateListeners[id].push(item);

			return function() {
				if (this.modelUpdateListeners[id]) {
					this.modelUpdateListeners[id].splice(this.modelUpdateListeners[id].indexOf(item), 1);
				}
			}.bind(this);
		},

		/**
       * @param [string] optional event
       */
		invokeModelUpdateListeners: function(event) {
			if (this.modelUpdateListenersEnabled) {
				Object.keys(this.modelUpdateListeners).forEach(function(id) {
					this.modelUpdateListeners[id].forEach(function(item) {
						if (item.strict) {
							if (id === event) {
								item.listener();
							}
						} else {
							item.listener();
						}
					});
				}.bind(this));
			}
		},

		invokeNewModelListeners: function() {
			Object.keys(this.newModelListeners).forEach(function(id) {
				this.newModelListeners[id].forEach(function(listener) {
					listener();
				});
			}.bind(this));
		},

		disableModelUpdateListeners: function() {
			this.modelUpdateListenersEnabled = false;
		},

		enableModelUpdateListeners: function() {
			this.modelUpdateListenersEnabled = true;
		},

		removeAllListeners: function() {
			var id;
			for (id in this.modelUpdateListeners) {
				delete this.modelUpdateListeners[id];
			}
			for (id in this.newModelListeners) {
				delete this.newModelListeners[id];
			}
		},

		removeModelUpdateListeners: function(id) {
			delete this.modelUpdateListeners[id];
		},

		removeNewModelListeners: function(id) {
			delete this.newModelListeners[id];
		},

		/**
       * Try to find a better position for each instances in order to prevent
       * UI overlapping in editor
       */
		fixOverlapping: function() {
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

			var groupX = GROUP_RADIUS + 20;
			this.model.groups.array.forEach(function(group) {
				relocate(group, {
					x: groupX,
					y: GROUP_RADIUS + 20
				});
				groupX += GROUP_RADIUS * 2 + 20;
			});

			var chanX = CHANNEL_RADIUS + 20;
			this.model.hubs.array.forEach(function(hub) {
				relocate(hub, {
					x: chanX,
					y: 180
				});
				chanX += CHANNEL_RADIUS * 2 + 20;
			});

			var nodeX = 25;
			this.model.nodes.array.forEach(function(node) {
				if (!node.host) {
					// root node (= no parent)
					var height = kModelHelper.getNodeTreeHeight(node);
					relocate(node, {
						x: nodeX,
						y: 220
					});
					nodeX += 230 + (height * 20);
				}
			});
		},

		/**
       * Create svg UIs based on current model
       */
		drawModel: function() {
			if (ui.editor) {
				this.model.hubs.array.forEach(function(instance) {
					ui.createChannel(instance);
				});

				this.model.nodes.array.sort(function(a, b) {
					// TODO optimize this to loop only once to create node tree heights
					return kModelHelper.getNodeTreeHeight(b) - kModelHelper.getNodeTreeHeight(a);
				}).forEach(function(instance) {
					ui.createNode(instance);
					instance.components.array.forEach(function(instance) {
						ui.createComponent(instance);
					});
				});

				this.model.groups.array.forEach(function(instance) {
					ui.createGroup(instance);
					instance.subNodes.array.forEach(function(node) {
						ui.createGroupWire(instance, node);
					});
				});

				this.model.mBindings.array.forEach(function(binding) {
					ui.createBinding(binding);
				});

				ui.order();
				this.model.select('**/metaData[name=' + KWE_FOLDED + ']').array.forEach(function(meta) {
					ui.toggleFold(meta.eContainer(), kModelHelper.isFolded(meta.eContainer()));
				});
			}
		},

		/**
       * @returns {boolean} true if model has errors
       */
		modelHasErrors: function() {
			// TODO
			return false;
		}
	};

	return new KevoreeEditor();
});
