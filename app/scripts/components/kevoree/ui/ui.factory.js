'use strict';

angular.module('editorApp')
    .factory('ui', function(util, uiUtils, uiCreateGroup, uiCreateGroupWire, uiCreateNode, uiCreateComponent, uiCreateBinding, uiCreateChannel, kModelHelper, kFactory, KWE_POSITION, NODE_WIDTH, NODE_HEIGHT, INVALID_RADIUS, GROUP_RADIUS, CHANNEL_RADIUS) {

        var ui = {
            /**
             * Current editor model
             */
            model: null,

            /**
             * Overed instance (node)
             */
            overedInstancePath: null,

            /**
             * Dragged instance path
             */
            draggedInstancePath: null,

            /**
             * Mouse position holder
             */
            mousePos: { x: 0, y: 0 },

            /**
             * Must be called before any other methods
             */
            init: function() {
                var editor = new Snap('svg#editor');
                editor.zpd({
                    zoomThreshold: [0.2, 1],
                    zoomScale: 0.05
                });
                var zpdEditor = this.editor = editor.select('#snapsvg-zpd-' + editor.id);
                zpdEditor.addClass('zpd');
                editor.mousedown(function(evt) {
                    if (evt.which === 1) {
                        // remove all selected state
                        editor.selectAll('.selected').forEach(function(elem) {
                            elem.removeClass('selected');
                        });
                        if (ui.listener) {
                            ui.listener();
                        }
                    }
                });
                uiUtils.updateSVGDefs(this.model);

                // create an observer instance
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.attributeName === 'transform') {
                            var matrix = zpdEditor.transform().localMatrix;
                            editor
                                .select('#coord-text')
                                .attr({
                                    text: '(' + parseInt(matrix.e, 10) + ', ' + parseInt(matrix.f, 10) + ') ' + parseInt(matrix.a * 100, 10) + '%'
                                });
                        }
                    });
                });

                // pass in the target node, as well as the observer options
                observer.observe(zpdEditor.node, {
                    attributes: true,
                    childList: false,
                    characterData: false
                });

                editor.dblclick(function() {
                    zpdEditor.animate({
                        transform: 's1,t0,0'
                    }, 400, mina.ease);
                });

                editor
                    .text('100%', '100%', '(0, 0) 100%')
                    .attr({
                        id: 'coord-text',
                        fill: '#000',
                        textAnchor: 'end'
                    })
                    .transform('t-5,-5');
            },

            createGroup: function (instance) {
                uiCreateGroup(this, instance);
            },

            createGroupWire: function (group, node) {
                uiCreateGroupWire(this, group, node);
            },

            createNode: function (instance) {
                uiCreateNode(this, instance);
            },

            createComponent: function (instance) {
                uiCreateComponent(this, instance);
            },

            createBinding: function (instance) {
                uiCreateBinding(this, instance);
            },

            createChannel: function (instance) {
                uiCreateChannel(this, instance);
            },

            updateValidity: function(instance) {
                var elem = this.editor.select('.instance[data-path="' + instance.path() + '"]');
                var icon = this.editor.select('.instance[data-path="' + instance.path() + '"] > .invalid-icon');
                if (kModelHelper.isValid(instance)) {
                    if (icon) {
                        icon.remove();
                    }
                } else {
                    if (icon) {
                        icon.remove();
                    }
                    icon = this.editor
                        .circle(0, 0, INVALID_RADIUS)
                        .attr({
                            'class': 'invalid-icon',
                            fill: 'red',
                            stroke: 'black',
                            title: 'Invalid dictionary attributes'
                        });
                    var matrix = icon.transform().localMatrix;
                    switch (kModelHelper.getTypeDefinitionType(instance.typeDefinition)) {
                        case 'node':
                            matrix.e = elem.getBBox().width - (INVALID_RADIUS * 2);
                            matrix.f = INVALID_RADIUS * 2;
                            break;

                        case 'group':
                            matrix.f = -GROUP_RADIUS + (INVALID_RADIUS * 2);
                            break;

                        case 'channel':
                            matrix.f = -CHANNEL_RADIUS + (INVALID_RADIUS * 2);
                            break;

                        case 'component':
                            matrix.e = elem.getBBox().width;
                            break;
                    }
                    icon.transform(matrix);
                    elem.append(icon);
                }
            },

            deleteInstance: function(parent, path) {
                var elem = this.editor.select('.instance[data-path="' + path + '"]');
                if (elem) {
                    if (elem.hasClass('comp') || elem.hasClass('node')) {
                        var highestNodePath = uiUtils.getHighestNodePath(elem);
                        if (ui.draggedInstancePath === path) {
                            // append it to the editor
                            this.editor.append(elem);
                        } else {
                            this.editor.selectAll('.group-wire[data-to="' + path + '"]').remove();
                            elem.remove();
                        }

                        ui.refreshNode(highestNodePath);

                        // refresh all group-wire from this whole node
                        var highestNode = ui.model.findByPath(highestNodePath);
                        if (highestNode) {
                            highestNode.groups.array.forEach(function(group) {
                                ui.createGroupWire(group, highestNode);
                            });
                            highestNode.hosts.array.forEach(function redrawWire(child) {
                                child.groups.array.forEach(function(group) {
                                    ui.createGroupWire(group, child);
                                });
                                child.hosts.array.forEach(redrawWire);
                            });

                            // redraw parent bindings
                            highestNode.components.array.forEach(function(comp) {
                                comp.provided.array.forEach(function(port) {
                                    port.bindings.array.forEach(function(binding) {
                                        ui.createBinding(binding);
                                    });
                                });
                                comp.required.array.forEach(function(port) {
                                    port.bindings.array.forEach(function(binding) {
                                        ui.createBinding(binding);
                                    });
                                });
                            });

                            // redraw sibling bindings
                            highestNode.hosts.array.forEach(function redrawBindings(child) {
                                child.components.array.forEach(function(comp) {
                                    comp.provided.array.forEach(function(port) {
                                        port.bindings.array.forEach(function(binding) {
                                            ui.createBinding(binding);
                                        });
                                    });
                                    comp.required.array.forEach(function(port) {
                                        port.bindings.array.forEach(function(binding) {
                                            ui.createBinding(binding);
                                        });
                                    });
                                });
                                child.hosts.array.forEach(redrawBindings);
                            });
                        }
                    } else {
                        elem.remove();
                    }
                }
                ui.invokeListener();
            },

            deleteGroupWire: function(groupPath, nodePath) {
                var elem = this.editor.select('.group-wire[data-from="' + groupPath + '"][data-to="' + nodePath + '"]');
                if (elem) {
                    elem.remove();
                }
            },

            deleteBinding: function(bindingPath) {
                var elem = this.editor.select('.binding[data-path="' + bindingPath + '"]');
                if (elem) {
                    elem.remove();
                }
            },

            deleteSelected: function() {
                var selected = this.getSelected();
                selected.forEach(function(elem) {
                    var path = elem.attr('data-path');
                    if (path) {
                        var instance = ui.model.findByPath(path);
                        if (instance) {
                            if (instance.hosts) {
                                // also remove child nodes recursively
                                instance.hosts.array.forEach(function deleteChild(node) {
                                    node.hosts.array.forEach(deleteChild);
                                    node.delete();
                                });
                            }
                            instance.delete();
                        }
                    } else {
                        if (elem.hasClass('group-wire')) {
                            var grp = ui.model.findByPath(elem.attr('data-from')),
                                node = ui.model.findByPath(elem.attr('data-to'));
                            if (node && grp) {
                                node.removeGroups(grp);
                                grp.removeSubNodes(node);
                            }
                        } else {
                            // TODO for component ports wire
                        }
                    }
                });
                return selected.length;
            },

            removeUIElem: function(path) {
                var elem = this.editor.select('.instance[data-path="' + path + '"]');
                if (elem) {
                    elem.remove();
                }
            },

            deleteNodes: function() {
                this.editor.selectAll('.node').remove();
                this.editor.selectAll('.group-wire').remove();
                ui.invokeListener();
            },

            deleteGroups: function() {
                this.editor.selectAll('.group').remove();
                this.editor.selectAll('.group-wire').remove();
                ui.invokeListener();
            },

            deleteChannels: function() {
                this.editor.selectAll('.chan').remove();
                ui.invokeListener();
            },

            deleteBindings: function() {
                this.editor.selectAll('.binding').remove();
                ui.invokeListener();
            },

            updateInstance: function(previousPath, instance) {
                var elem = this.editor.select('.instance[data-path="' + previousPath + '"]');
                if (elem) {
                    // update data-path and name
                    elem.attr({
                            'data-path': instance.path()
                        })
                        .select('text.name')
                        .attr({
                            text: instance.name
                        });

                    // update location only if not a child of someone
                    if (!elem.parent().hasClass('node')) {
                        elem.relocate(instance);
                    }

                    // update children data-path if any
                    if (instance.components || instance.hosts) {
                        instance.components.array.forEach(function(comp) {
                            var compElem = elem.select('.instance[data-path="' + previousPath + '/components[' + comp.name + ']"]');
                            if (compElem) {
                                compElem.attr({
                                    'data-path': comp.path().replace(previousPath, instance.path())
                                });
                            }
                        });
                    }

                    // update started state
                    if (elem.hasClass('comp')) {
                        elem.select('.bg')
                            .attr({
                                fillOpacity: util.isTruish(instance.started) ? 1 : 0.65
                            });
                    } else {
                        elem.select('text.name')
                            .attr({
                                fill: util.isTruish(instance.started) ? '#fff' : '#000'
                            });
                    }

                    // update group-wire if it is a node
                    if (elem.hasClass('node')) {
                        this.editor
                            .selectAll('.group-wire[data-to="' + previousPath + '"]')
                            .attr({
                                'data-to': instance.path()
                            });
                    }

                    if (elem.hasClass('group')) {
                        this.editor
                            .selectAll('.group-wire[data-from="' + previousPath + '"]')
                            .attr({
                                'data-from': instance.path()
                            });
                    }
                }
            },

            updatePosition: function(instance) {
                var elem = this.editor.select('.instance[data-path="' + instance.path() + '"]');
                if (elem) {
                    if (!elem.parent().hasClass('node')) {
                        elem.relocate(instance);
                    }
                }
            },

            updateCompTypeDefinition: function(comp, oldTypeDef) {
                // get rid of the old bindings (if any) related to old type def
                var compare = kFactory.createModelCompare();
                var diff = compare.diff(oldTypeDef, comp.typeDefinition);
                var portType, port;
                diff.traces.array.forEach(function(trace) {
                    if (trace.traceType.name() === 'REMOVE') {
                        switch (trace.refName) {
                            case 'provided':
                                // remove of a provided port
                                portType = ui.model.findByPath(trace.objPath);
                                port = comp.findProvidedByID(portType.name);
                                if (port) {
                                    port.delete();
                                }
                                break;

                            case 'required':
                                // remove of a required port
                                portType = ui.model.findByPath(trace.objPath);
                                port = comp.findRequiredByID(portType.name);
                                if (port) {
                                    port.delete();
                                }
                                break;
                        }
                    } else if (trace.traceType.name() === 'ADD') {
                        switch (trace.refName) {
                            case 'provided':
                                // add a provided port
                                portType = ui.model.findByPath(trace.previousPath);
                                port = kFactory.createPort();
                                port.name = portType.name;
                                port.portTypeRef = portType;
                                comp.addProvided(port);
                                break;

                            case 'required':
                                // add a required port
                                portType = ui.model.findByPath(trace.previousPath);
                                port = kFactory.createPort();
                                port.name = portType.name;
                                port.portTypeRef = portType;
                                comp.addRequired(port);
                                break;
                        }

                    }
                });

                // recreate the new component
                ui.createComponent(comp);
            },

            /**
             * Refresh a node's UI (and it's children too)
             * @param path
             */
            refreshNode: function(path) {
                var instance = ui.model.findByPath(path);
                if (instance) {
                    var node = ui.editor.select('.node[data-path="' + path + '"]');
                    var treeHeight = kModelHelper.getNodeTreeHeight(instance);
                    var computedWidth = NODE_WIDTH + (20 * treeHeight);
                    if (instance.host) {
                        computedWidth = NODE_WIDTH + (20 * (kModelHelper.getNodeTreeHeight(instance.host) - 1));
                    }

                    node.relocate(instance);

                    node.select('.bg').attr({
                        width: computedWidth,
                        height: uiUtils.getNodeUIHeight(instance)
                    });

                    ui.editor
                        .selectAll('.node[data-path="' + path + '"] > text')
                        .attr({
                            x: computedWidth / 2,
                            'clip-path': 'url(#node-clip-' + treeHeight + ')'
                        });

                    instance.components.array.forEach(function(comp) {
                        ui.refreshComp(comp.path());
                    });

                    instance.hosts.array.forEach(function(host) {
                        ui.refreshNode(host.path());
                    });

                    // apply dx,dy transformation of level-1 children
                    var children = ui.editor.selectAll('.node[data-path="' + instance.path() + '"] > .instance').items;
                    var dy = NODE_HEIGHT;
                    children.forEach(function(child) {
                        child.transform('t' + ((computedWidth - child.select('.bg').asPX('width')) / 2) + ',' + dy);
                        dy += child.select('.bg').asPX('height') + 10;
                    });

                    this.updateValidity(instance);
                }
            },

            /**
             *
             * @param path
             */
            refreshComp: function(path) {
                var instance = ui.model.findByPath(path);
                if (instance) {
                    var comp = ui.editor.select('.comp[data-path="' + path + '"]');
                    var host = ui.editor.select('.node[data-path="' + instance.eContainer().path() + '"]');
                    var treeHeight = kModelHelper.getNodeTreeHeight(instance.eContainer());
                    var computedWidth = host.select('.bg').asPX('width') - 20;

                    if (comp && host) {
                        comp.select('.bg').attr({
                            width: computedWidth
                        });
                        ui.editor
                            .selectAll('.comp[data-path="' + path + '"] > text')
                            .attr({
                                x: computedWidth / 2,
                                'clip-path': 'url(#comp-clip-' + treeHeight + ')'
                            });

                        var PORT_X_PADDING = 24;
                        instance.typeDefinition.required.array.forEach(function(portType) {
                            var port = comp.select('.required[data-name="' + portType.name + '"]');
                            port.transform('t' + (computedWidth - PORT_X_PADDING) + ',' + port.transform().localMatrix.f);
                        });

                        this.updateValidity(instance);
                    }
                }
            },

            getSelected: function() {
                return this.editor
                    .selectAll('.selected').items
                    .map(function(elem) {
                        // all selected element are in groups so we need to return the parent
                        return elem.parent();
                    });
            },

            getSelectedPaths: function() {
                return this.getSelected().map(function(elem) {
                    return elem.attr('data-path');
                });
            },

            getSelectedNodes: function() {
                return this.editor
                    .selectAll('.node > .selected').items
                    .map(function(bg) {
                        return bg.parent();
                    });
            },

            getNodePathAtPoint: function(x, y) {
                var container = this.getEditorContainer();
                var node = ui.getHoveredNode(x - container.offsetLeft, y - container.offsetTop);
                if (node) {
                    return node.attr('data-path');
                } else {
                    return null;
                }
            },

            getEditorContainer: function() {
                return document.getElementById('editor-container');
            },

            setSelectedListener: function(listener) {
                this.listener = listener;
            },

            selectAll: function() {
                this.editor.selectAll('.bg').items.forEach(function(elem) {
                    elem.addClass('selected');
                });
            },

            isSelected: function(path) {
                var elem = this.editor.select('.instance[data-path="' + path + '"]');
                if (elem) {
                    if (elem.select('.bg').hasClass('selected')) {
                        return true;
                    }
                }

                return false;
            },

            setDropTarget: function(elem) {
                this.dropTarget = elem;
            },

            getDropTarget: function() {
                return this.dropTarget;
            },

            setModel: function(model) {
                this.model = model;
                if (this.editor) {
                    uiUtils.updateSVGDefs(model);

                    this.editor.clear();
                    ui.invokeListener();
                }
            },

            getHoveredNode: function(x, y, bannedPath) {
                return this.editor
                    .selectAll('.node').items
                    .filter(function(node) {
                        if (bannedPath) {
                            return node.attr('data-path') !== bannedPath &&
                                uiUtils.isPointInsideElem(node, x, y);
                        } else {
                            return uiUtils.isPointInsideElem(node, x, y);
                        }
                    })
                    .sort(function(a, b) {
                        return a.getBBox().width - b.getBBox().width;
                    })[0];
            },

            getHoveredChan: function(x, y) {
                var chans = this.editor
                    .selectAll('.chan').items;
                for (var i = 0; i < chans.length; i++) {
                    if (Snap.path.isPointInsideBBox(chans[i].getBBox(), x, y)) {
                        return chans[i];
                    }
                }
                return null;
            },

            getHoveredPort: function (x, y) {
                var ports = this.editor
                    .selectAll('.port').items;
                for (var i = 0; i < ports.length; i++) {
                    if (uiUtils.isPointInsideElem(ports[i], x, y)) {
                        return ports[i];
                    }
                }
                return null;
            },

            invokeListener: function(selected) {
                if (this.listener) {
                    if (selected) {
                        this.listener(selected);
                    } else {
                        selected = this.editor.select('.selected');
                        if (selected) {
                            this.listener(selected.parent().attr('data-path'));
                        } else {
                            this.listener(null);
                        }
                    }
                }
            },

            hasErrors: function () {
                return this.editor.selectAll('.invalid-icon').length > 0;
            },

            order: function () {
                this.editor.selectAll('.binding').forEach(function (binding) {
                    binding.node.parentNode.appendChild(binding.node);
                });
            }
        };

        /**
         *
         */
        Snap.plugin(function(Snap, Element) {
            var dragStart = function(x, y, evt) {
                if (!this.parent().hasClass('instance')) {
                    var instances = angular.element(ui.editor.node).find('> .instance');
                    this.node.parentNode.insertBefore(this.node, instances[instances.length-1].nextSibling);
                }

                this.data('dragStartX', x);
                this.data('dragStartY', y);

                ui.draggedInstancePath = this.attr('data-path');

                var handlers = this.data('dragStart');
                if (handlers) {
                    handlers.forEach(function(handler) {
                        handler.apply(this, [x, y, evt]);
                    }.bind(this));
                }

                if (this.hasClass('comp') || this.hasClass('node')) {
                    var bbox = uiUtils.getAbsoluteBBox(this);
                    this.data('ot', 't' + bbox.x + ',' + bbox.y);
                } else {
                    this.data('ot', this.transform().local);
                }

                this.data('hasMoved', false);
            };

            var dragMove = function(dx, dy, x, y, evt) {
                var dragStartX = this.data('dragStartX'),
                    dragStartY = this.data('dragStartY');
                if (typeof dragStartX !== 'undefined' && typeof dragStartY !== 'undefined') {
                    if ((typeof dx === 'object') && (dx.type === 'touchmove')) {
                        evt = dx;
                        x = evt.changedTouches[0].clientX;
                        y = evt.changedTouches[0].clientY;
                        dx = x - dragStartX;
                        dy = y - dragStartY;
                    }

                    this.transform(this.data('ot') + (this.data('ot') ? 'T' : 't') + [dx, dy]);

                    if (this.data('hasMoved')) {
                        var handlers = this.data('dragMove');
                        if (handlers) {
                            handlers.forEach(function(handler) {
                                handler.apply(this, [dx, dy, x, y, evt]);
                            }.bind(this));
                        }
                    } else {
                        this.data('hasMoved', true);
                        var firstDragMoveHandlers = this.data('firstDragMove');
                        if (firstDragMoveHandlers) {
                            firstDragMoveHandlers.forEach(function(handler) {
                                handler.apply(this, [dx, dy, x, y, evt]);
                            }.bind(this));
                        }
                    }
                }
            };

            var dragEnd = function() {
                var args = arguments;
                if (this.data('hasMoved')) {
                    // update position
                    var instance = ui.model.findByPath(this.attr('data-path'));
                    if (instance) {
                        // update model with new position on drag end
                        var pos = instance.findMetaDataByID(KWE_POSITION);
                        if (!pos) {
                            pos = kFactory.createValue();
                            pos.name = KWE_POSITION;
                            instance.addMetaData(pos);
                        }
                        var matrix = this.transform().localMatrix;
                        pos.value = JSON.stringify({
                            x: matrix.e,
                            y: matrix.f
                        });
                    }

                    // trigger handlers
                    var handlers = this.data('dragEnd');
                    if (handlers) {
                        handlers.forEach(function(handler) {
                            handler.apply(this, args);
                        }.bind(this));
                    }

                    this.data('hasMoved', false);
                }
                this.removeData('dragStartX');
                this.removeData('dragStartY');
                this.removeData('ot');
                ui.draggedInstancePath = null;
            };

            Element.prototype.draggable = function() {
                return this.drag(function (dx, dy, x, y, evt) {
                    if (evt.which === 1) {
                        dragMove.apply(this, arguments);
                    }
                }, function (x, y, evt) {
                    if (evt.which === 1) {
                        dragStart.apply(this, arguments);
                    }
                }, function (evt) {
                    if (evt.which === 1) {
                        dragEnd.apply(this, arguments);
                    }
                });
            };

            Element.prototype.dragStart = function(handler) {
                var handlers = this.data('dragStart') || [];
                handlers.push(handler);
                return this.data('dragStart', handlers);
            };

            Element.prototype.dragEnd = function(handler) {
                var handlers = this.data('dragEnd') || [];
                handlers.push(handler);
                return this.data('dragEnd', handlers);
            };

            Element.prototype.dragMove = function(handler) {
                var handlers = this.data('dragMove') || [];
                handlers.push(handler);
                return this.data('dragMove', handlers);
            };

            Element.prototype.startPtDrag = function(handler) {
                return this.data('startPtDrag', handler);
            };

            Element.prototype.endPtDrag = function(handler) {
                return this.data('endPtDrag', handler);
            };

            Element.prototype.firstDragMove = function(handler) {
                var handlers = this.data('firstDragMove') || [];
                handlers.push(handler);
                return this.data('firstDragMove', handlers);
            };

            Element.prototype.selectable = function() {
                var selectable = function (evt) {
                    if (evt.which === 1) {
                        evt.cancelBubble = true;

                        if (!evt.ctrlKey && !evt.shiftKey) {
                            ui.editor.selectAll('.selected').forEach(function(elem) {
                                elem.removeClass('selected');
                            });
                        }
                        if (evt.ctrlKey || evt.shiftKey) {
                            this.select('.bg').toggleClass('selected');

                        } else {
                            this.select('.bg').addClass('selected');
                        }
                        if (ui.listener) {
                            var selected = ui.editor.selectAll('.selected').items;
                            if (selected.length === 1) {
                                ui.listener(selected[0].parent().attr('data-path'));
                            } else {
                                ui.listener();
                            }
                        }
                    }
                };

                return this
                    .mousedown(selectable)
                    .touchstart(selectable);
            };

            Element.prototype.relocate = function(instance) {
                var meta = instance.findMetaDataByID(KWE_POSITION);
                var pos = {
                    x: 100,
                    y: 100
                };
                if (meta) {
                    try {
                        pos = JSON.parse(meta.value);
                    } catch (ignore) {
                        pos = {
                            x: 100,
                            y: 100
                        };
                    }
                } else {
                    meta = kFactory.createValue();
                    meta.name = KWE_POSITION;
                    meta.value = JSON.stringify(pos);
                    instance.addMetaData(meta);
                }
                return this.transform('t' + pos.x + ',' + pos.y);
            };
        });

        return ui;
    });
