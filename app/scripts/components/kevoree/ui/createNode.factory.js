'use strict';

angular.module('editorApp')
    .factory('uiCreateNode', function (uiUtils, util, kModelHelper, NODE_WIDTH, NODE_HEIGHT) {
        return function(ui, instance) {
            ui.removeUIElem(instance.path());
            uiUtils.updateSVGDefs(ui.model);

            var treeHeight = kModelHelper.getNodeTreeHeight(instance);
            var computedWidth = NODE_WIDTH + (20 * treeHeight);
            if (instance.host) {
                computedWidth = NODE_WIDTH + (20 * (kModelHelper.getNodeTreeHeight(instance.host) - 1));
            }
            var computedHeight = uiUtils.getNodeUIHeight(instance);

            var bg = ui.editor
                .rect(0, 0, computedWidth, computedHeight, 8)
                .attr({
                    fill: 'white',
                    fillOpacity: 0.1,
                    stroke: 'white',
                    strokeWidth: 2,
                    'class': 'bg'
                });

            var nameText = ui.editor
                .text(computedWidth / 2, NODE_HEIGHT / 2 - 2, instance.name)
                .attr({
                    fill: util.isTruish(instance.started) ? '#fff' : '#000',
                    textAnchor: 'middle',
                    'class': 'name',
                    'clip-path': 'url(#node-clip-' + treeHeight + ')'
                });

            var tdefText = ui.editor
                .text(computedWidth / 2, (NODE_HEIGHT / 2) + 12, instance.typeDefinition.name)
                .attr({
                    fill: 'white',
                    textAnchor: 'middle',
                    'clip-path': 'url(#node-clip-' + treeHeight + ')'
                });

            var node = ui.editor
                .group()
                .attr({
                    'class': 'instance node',
                    'data-path': instance.path()
                })
                .append(bg)
                .append(nameText)
                .append(tdefText)
                .selectable()
                .draggable()
                .dragStart(function() {
                    var container = document.getElementById('editor-container');
                    this.data('offset', {
                        left: container.offsetLeft,
                        top: container.offsetTop
                    });
                })
                .firstDragMove(function() {
                    var args = arguments;
                    if (instance.host) {
                        // remove instance from host
                        instance.host.removeHosts(instance);
                    }

                    // trigger bindings firstDragMove while dragging start
                    var redrawBindings = function(comp) {
                        var redrawBinding = function(binding) {
                            var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
                            if (elem) {
                                elem.data('firstDragMove').forEach(function(handler) {
                                    handler.apply(elem, args);
                                });
                            }
                        }.bind(this);

                        comp.provided.array.forEach(function(port) {
                            port.bindings.array.forEach(redrawBinding);
                        });

                        comp.required.array.forEach(function(port) {
                            port.bindings.array.forEach(redrawBinding);
                        });
                    }.bind(this);
                    instance.components.array.forEach(redrawBindings);

                    // recursive redraw
                    instance.hosts.array.forEach(function redrawChild(child) {
                        child.components.array.forEach(redrawBindings);
                        child.hosts.array.forEach(redrawChild);
                    });
                })
                .dragMove(function(dx, dy, clientX, clientY) {
                    var args = arguments;

                    // ui-error feedback
                    clearTimeout(this.data('dragTimeout'));
                    var nodeElem = this.data('hoveredNode');
                    if (nodeElem) {
                        nodeElem.select('.bg').removeClass('hovered error');
                    }

                    var timeout = setTimeout(function() {
                        var offset = this.data('offset') || {
                            left: 0,
                            right: 0
                        };
                        var nodeElem = ui.getHoveredNode(clientX - offset.left, clientY - offset.top, instance.path());
                        if (nodeElem) {
                            this.data('hoveredNode', nodeElem);
                            nodeElem.select('.bg').addClass('hovered');
                        } else {
                            this.data('hoveredNode', null);
                        }
                    }.bind(this), 100);
                    this.data('dragTimeout', timeout);

                    // redraw group-wire while dragging
                    var redrawWire = function(group, node) {
                        var wire = ui.editor.select('.group-wire[data-from="' + group.path() + '"][data-to="' + node.path() + '"]');
                        if (wire) {
                            wire.data('endPtDrag').apply(wire, args);
                        }
                    };
                    instance.groups.array.forEach(function(group) {
                        redrawWire(group, instance);
                    });

                    // redraw bindings while dragging
                    var redrawBindings = function(comp) {
                        var redrawBinding = function(binding) {
                            var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
                            if (elem) {
                                elem.data('endPtDrag').apply(elem, args);
                            }
                        }.bind(this);

                        comp.provided.array.forEach(function(port) {
                            port.bindings.array.forEach(redrawBinding);
                        });

                        comp.required.array.forEach(function(port) {
                            port.bindings.array.forEach(redrawBinding);
                        });
                    }.bind(this);
                    instance.components.array.forEach(redrawBindings);

                    // recursive redraw
                    instance.hosts.array.forEach(function redrawChild(child) {
                        child.components.array.forEach(redrawBindings);
                        child.groups.array.forEach(function(group) {
                            redrawWire(group, child);
                        });
                        child.hosts.array.forEach(redrawChild);
                    });
                })
                .dragEnd(function() {
                    var args = arguments;

                    var hoveredNode = this.data('hoveredNode');
                    if (hoveredNode) {
                        // remove green ui-feedback
                        hoveredNode.select('.bg').removeClass('hovered error');

                        // put it in the hovered node
                        node.remove();
                        ui.model.findByPath(hoveredNode.attr('data-path')).addHosts(instance);
                    }

                    function updateWire(group, node) {
                        var wire = ui.editor.select('.group-wire[data-from="' + group.path() + '"][data-to="' + node.path() + '"]');
                        if (wire) {
                            wire.data('dragEnd').forEach(function(handler) {
                                handler.apply(wire, args);
                            });
                        }
                    }
                    instance.groups.array.forEach(function(group) {
                        this.removeData(group.path());
                        updateWire(group, instance);
                    }.bind(this));

                    clearTimeout(this.data('dragTimeout'));

                    // update bindings coords when dragging done
                    function updateBindings(comp) {
                        function updateBindingCoords(binding) {
                            var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
                            if (elem) {
                                elem.data('dragEnd').forEach(function(handler) {
                                    handler.apply(elem, args);
                                });
                            }
                        }

                        comp.provided.array.forEach(function(port) {
                            port.bindings.array.forEach(updateBindingCoords);
                        });

                        comp.required.array.forEach(function(port) {
                            port.bindings.array.forEach(updateBindingCoords);
                        });
                    }
                    instance.components.array.forEach(updateBindings);
                    instance.hosts.array.forEach(function redrawChild(child) {
                        child.components.array.forEach(updateBindings);
                        child.groups.array.forEach(function(group) {
                            updateWire(group, child);
                        });
                        child.hosts.array.forEach(redrawChild);
                    });

                    this.removeData('dragTimeout');
                    this.removeData('hoveredNode');
                    this.removeData('offset');
                });

            if (instance.host) {
                var host = ui.editor.select('.node[data-path="' + instance.host.path() + '"]');
                var children = host.selectAll('.node[data-path="' + instance.host.path() + '"] > .instance').items;
                var dx = (host.select('.bg').asPX('width') - computedWidth) / 2,
                    dy = NODE_HEIGHT;
                children.forEach(function(child) {
                    dy += child.select('.bg').asPX('height') + 10;
                });
                host.append(node);
                node.transform('t' + dx + ',' + dy);
            } else {
                node.relocate(instance);
            }

            ui.updateValidity(instance);
        };
    });
