'use strict';

angular.module('editorApp')
    .factory('uiFactory', function (kFactory, kModelHelper, KWE_POSITION) {
        var GROUP_RADIUS = 55,
            GROUP_PLUG_RADIUS = 10,
            NODE_WIDTH = 210,
            NODE_HEIGHT = 50,
            COMP_HEIGHT = 40,
            CHANNEL_RADIUS = 45;

        var factory = {
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
            init: function () {
                var editor = new Snap('svg#editor');
                editor.zpd({ zoomThreshold: [ 0.2, 1 ], zoomScale: 0.05 });
                var zpdEditor = this.editor = editor.select('#snapsvg-zpd-'+editor.id);
                editor.mousedown(function () {
                    // remove all selected state
                    editor.selectAll('.selected').forEach(function (elem) {
                        elem.removeClass('selected');
                    });
                    if (factory.listener) {
                        factory.listener();
                    }
                });
                updateSVGDefs(this.model);

                // create an observer instance
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.attributeName === 'transform') {
                            var matrix = zpdEditor.transform().localMatrix;
                            editor
                                .select('#coord-text')
                                .attr({
                                    text: '('+parseInt(matrix.e, 10)+', '+parseInt(matrix.f, 10)+') '+parseInt(matrix.a * 100, 10)+'%'
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

                editor.dblclick(function () {
                    zpdEditor.animate({transform: 's1,t0,0'}, 400, mina.ease);
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

            /**
             *
             * @param instance
             * @returns {*}
             */
            createGroup: function (instance) {
                this.removeUIElem(instance.path());
                updateSVGDefs(this.model);

                var bg = this.editor
                    .circle(0, 0, GROUP_RADIUS)
                    .attr({
                        fill: 'green',
                        stroke: '#000',
                        strokeWidth: 3,
                        'class': 'bg',
                        opacity: 0.75
                    });

                var plug = this.editor
                    .circle(0, (GROUP_RADIUS/2)+GROUP_PLUG_RADIUS, GROUP_PLUG_RADIUS)
                    .attr({
                        fill: '#f1c30f',
                        'class': 'group-plug'
                    })
                    .mouseover(function () {
                        this.attr({r: GROUP_PLUG_RADIUS+1});
                    })
                    .mouseout(function () {
                        this.attr({r: GROUP_PLUG_RADIUS});
                    })
                    .drag(
                    function (dx, dy) {
                        var plugPos = this.data('plugPos');
                        this.data('wire').attr({
                            d: 'M'+plugPos.x+','+plugPos.y+' '+(plugPos.x + dx)+','+(plugPos.y + dy)
                        });

                        clearTimeout(this.data('wireTimeout'));
                        var nodeElem = this.data('hoveredNode');
                        if (nodeElem) {
                            nodeElem.select('.bg').removeClass('hovered error');
                        }

                        var timeout = setTimeout(function () {
                            var nodeElem = factory.getHoveredNode(plugPos.x + dx, plugPos.y + dy);
                            if (nodeElem) {
                                this.data('hoveredNode', nodeElem);
                                var nodeBg = nodeElem.select('.bg');
                                nodeBg.addClass('hovered');

                                var node = factory.model.findByPath(nodeElem.attr('data-path'));
                                if (instance.findSubNodesByID(node.name)) {
                                    nodeBg.addClass('error');
                                }
                            } else {
                                this.data('hoveredNode', null);
                            }
                        }.bind(this), 100);
                        this.data('wireTimeout', timeout);
                    },
                    function () {
                        var grpM = group.transform().localMatrix;
                        var plugPos = {
                            x: grpM.e,
                            y: grpM.f + (GROUP_RADIUS/2)+GROUP_PLUG_RADIUS
                        };
                        this.data('plugPos', plugPos);
                        var wire = factory.editor
                            .path('M'+plugPos.x+','+plugPos.y+' '+plugPos.x+','+plugPos.y)
                            .attr({
                                fill: 'none',
                                stroke: '#5aa564',
                                strokeWidth: 5,
                                strokeLineCap: 'round',
                                strokeLineJoin: 'round',
                                opacity: 0.7
                            });
                        this.data('wire', wire);
                    },
                    function () {
                        var nodeElem = this.data('hoveredNode');
                        if (nodeElem) {
                            if (!nodeElem.select('.bg').hasClass('error')) {
                                // node elem found
                                var nodeInstance = factory.model.findByPath(nodeElem.attr('data-path'));
                                if (instance.findSubNodesByID(nodeInstance.name)) {
                                    // this node is already connected to the group
                                } else {
                                    // this node is not connected to the group
                                    instance.addSubNodes(nodeInstance);
                                }
                            }

                            // remove ui feedback
                            nodeElem.select('.bg').removeClass('hovered error');
                        }

                        this.data('wire').remove();
                        clearTimeout(this.data('wireTimeout'));

                        this.removeData('wire');
                        this.removeData('hoveredNode');
                        this.removeData('plugPos');
                        this.removeData('wireTimeout');
                    }
                );

                var nameText = this.editor
                    .text(0, -5, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#group-clip)'
                    });

                var tdefText = this.editor
                    .text(0, 10, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#group-clip)'
                    });

                var group = this.editor
                    .group()
                    .attr({ 'class': 'instance group', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .append(plug)
                    .selectable()
                    .draggable()
                    .dragMove(function () {
                        var args = arguments;
                        instance.subNodes.array.forEach(function (subNode) {
                            var wire = factory.editor.select('.group-wire[data-from="'+instance.path()+'"][data-to="'+subNode.path()+'"]');
                            if (wire) {
                                wire.data('startPtDrag').apply(wire, args);
                            }
                        }.bind(this));
                    })
                    .dragEnd(function () {
                        var args = arguments;
                        instance.subNodes.array.forEach(function (subNode) {
                            var wire = factory.editor.select('.group-wire[data-from="'+instance.path()+'"][data-to="'+subNode.path()+'"]');
                            if (wire) {
                                wire.data('dragEnd').forEach(function (handler) {
                                    handler.apply(wire, args);
                                });
                            }
                        }.bind(this));
                    })
                    .relocate(instance);

                plug.touchstart(function (evt) {
                    evt.cancelBubble = true;
                });
                plug.mousedown(function (evt) {
                    evt.cancelBubble = true;


                }.bind(this));

                return group;
            },

            createGroupWire: function (group, node) {
                var grpElem, nodeElem, wireElem, data = {};

                function computeData() {
                    grpElem = factory.editor.select('.group[data-path="'+group.path()+'"]');
                    nodeElem = factory.editor.select('.node[data-path="'+node.path()+'"]');
                    wireElem = factory.editor.select('.group-wire[data-from="'+group.path()+'"][data-to="'+node.path()+'"]');

                    var grpMatrix = grpElem.transform().localMatrix,
                        toBox = getAbsoluteBBox(nodeElem);

                    data = {
                        from: { x: grpMatrix.e, y: grpMatrix.f + (GROUP_RADIUS/2) + GROUP_PLUG_RADIUS },
                        to:   { x: toBox.x, y: toBox.y },
                        width: nodeElem.select('.bg').asPX('width'),
                        height: nodeElem.select('.bg').asPX('height')
                    };
                }
                computeData();
                var toAnchor = computeWireNodeAnchor(data.from, data.to, data.width, data.height);

                if (wireElem) {
                    // update data
                    wireElem
                        .data('data', data);
                    // update bg location
                    wireElem
                        .selectAll('path')
                        .attr({
                            d: 'M'+data.from.x+','+data.from.y+' '+toAnchor.x+','+toAnchor.y
                        });
                    // update node plug location
                    wireElem
                        .select('circle')
                        .attr({
                            cx: toAnchor.x,
                            cy: toAnchor.y
                        });
                } else {
                    var wireBg = this.editor
                        .path('M'+data.from.x+','+data.from.y+' '+toAnchor.x+','+toAnchor.y)
                        .attr({
                            fill: 'none',
                            stroke: '#5aa564',
                            strokeWidth: 4,
                            strokeLineCap: 'round',
                            strokeLineJoin: 'round',
                            'class': 'bg'
                        })
                        .mouseover(function () {
                            this.attr({ strokeWidth: 5 });
                        })
                        .mouseout(function () {
                            this.attr({ strokeWidth: 4 });
                        });

                    var nodePlug = this.editor
                        .circle(toAnchor.x, toAnchor.y, 4)
                        .attr({ fill: 'white' });

                    this.editor
                        .group()
                        .attr({
                            'class': 'group-wire',
                            'data-from': group.path(),
                            'data-to': node.path()
                        })
                        .data('data', data)
                        .append(wireBg)
                        .append(nodePlug)
                        .selectable()
                        .startPtDrag(function (dx, dy) {
                            var data = this.data('data');
                            var nFrom = {
                                x: data.from.x + dx,
                                y: data.from.y + dy
                            };
                            var anchor = computeWireNodeAnchor(nFrom, data.to, data.width, data.height);
                            wireBg.attr({
                                d: 'M' + nFrom.x + ',' + nFrom.y + ' ' + anchor.x + ',' + anchor.y
                            });
                            nodePlug.attr({
                                cx: anchor.x,
                                cy: anchor.y
                            });
                        })
                        .endPtDrag(function (dx, dy) {
                            var data = this.data('data');
                            var nTo = {
                                x: data.to.x + dx,
                                y: data.to.y + dy
                            };
                            var anchor = computeWireNodeAnchor(data.from, nTo, data.width, data.height);
                            wireBg.attr({
                                d: 'M'+data.from.x+','+data.from.y+' '+anchor.x+','+anchor.y
                            });
                            nodePlug.attr({
                                cx: anchor.x,
                                cy: anchor.y
                            });
                        })
                        .dragEnd(function () {
                            computeData();
                            this.data('data', data);
                        });
                }
            },

            createNode: function (instance) {
                this.removeUIElem(instance.path());
                updateSVGDefs(this.model);

                var treeHeight = kModelHelper.getNodeTreeHeight(instance);
                var computedWidth = NODE_WIDTH+(20*treeHeight);
                if (instance.host) {
                    computedWidth = NODE_WIDTH+(20*(kModelHelper.getNodeTreeHeight(instance.host)-1));
                }
                var computedHeight = getNodeUIHeight(instance);

                var bg = this.editor
                    .rect(0, 0, computedWidth, computedHeight, 8)
                    .attr({
                        fill: 'white',
                        fillOpacity: 0.1,
                        stroke: 'white',
                        strokeWidth: 2,
                        'class': 'bg'
                    });

                var nameText = this.editor
                    .text(computedWidth/2, NODE_HEIGHT/2 - 2, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#node-clip-'+treeHeight+')'
                    });

                var tdefText = this.editor
                    .text(computedWidth/2, (NODE_HEIGHT/2) + 12, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#node-clip-'+treeHeight+')'
                    });

                var node = this.editor
                    .group()
                    .attr({ 'class': 'instance node', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .selectable()
                    .draggable()
                    .dragStart(function () {
                        var container = document.getElementById('editor-container');
                        this.data('offset', { left: container.offsetLeft, top: container.offsetTop });
                    })
                    .firstDragMove(function () {
                        var args = arguments;
                        if (instance.host) {
                            // remove instance from host
                            instance.host.removeHosts(instance);
                        }

                        // trigger bindings firstDragMove while dragging start
                        var redrawBindings = function (comp) {
                            var redrawBinding = function (binding) {
                                var elem = factory.editor.select('.binding[data-path="'+binding.path()+'"]');
                                if (elem) {
                                    elem.data('firstDragMove').forEach(function (handler) {
                                        handler.apply(elem, args);
                                    });
                                }
                            }.bind(this);

                            comp.provided.array.forEach(function (port) {
                                port.bindings.array.forEach(redrawBinding);
                            });

                            comp.required.array.forEach(function (port) {
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
                    .dragMove(function (dx, dy, clientX, clientY) {
                        var args = arguments;

                        // ui-error feedback
                        clearTimeout(this.data('dragTimeout'));
                        var nodeElem = this.data('hoveredNode');
                        if (nodeElem) {
                            nodeElem.select('.bg').removeClass('hovered error');
                        }

                        var timeout = setTimeout(function () {
                            var offset = this.data('offset') || { left: 0, right: 0 };
                            var nodeElem = factory.getHoveredNode(clientX - offset.left, clientY - offset.top, instance.path());
                            if (nodeElem) {
                                this.data('hoveredNode', nodeElem);
                                nodeElem.select('.bg').addClass('hovered');
                            } else {
                                this.data('hoveredNode', null);
                            }
                        }.bind(this), 100);
                        this.data('dragTimeout', timeout);

                        // redraw group-wire while dragging
                        var redrawWire = function (group, node) {
                            var wire = factory.editor.select('.group-wire[data-from="'+group.path()+'"][data-to="'+node.path()+'"]');
                            if (wire) {
                                wire.data('endPtDrag').apply(wire, args);
                            }
                        };
                        instance.groups.array.forEach(function (group) {
                            redrawWire(group, instance);
                        });

                        // redraw bindings while dragging
                        var redrawBindings = function (comp) {
                            var redrawBinding = function (binding) {
                                var elem = factory.editor.select('.binding[data-path="'+binding.path()+'"]');
                                if (elem) {
                                    elem.data('startPtDrag').apply(elem, args);
                                }
                            }.bind(this);

                            comp.provided.array.forEach(function (port) {
                                port.bindings.array.forEach(redrawBinding);
                            });

                            comp.required.array.forEach(function (port) {
                                port.bindings.array.forEach(redrawBinding);
                            });
                        }.bind(this);
                        instance.components.array.forEach(redrawBindings);

                        // recursive redraw
                        instance.hosts.array.forEach(function redrawChild(child) {
                            child.components.array.forEach(redrawBindings);
                            child.groups.array.forEach(function (group) {
                                redrawWire(group, child);
                            });
                            child.hosts.array.forEach(redrawChild);
                        });
                    })
                    .dragEnd(function () {
                        var args = arguments;

                        var hoveredNode = this.data('hoveredNode');
                        if (hoveredNode) {
                            // remove green ui-feedback
                            hoveredNode.select('.bg').removeClass('hovered error');

                            // put it in the hovered node
                            node.remove();
                            factory.model.findByPath(hoveredNode.attr('data-path')).addHosts(instance);
                        }

                        function updateWire(group, node) {
                            var wire = factory.editor.select('.group-wire[data-from="'+group.path()+'"][data-to="'+node.path()+'"]');
                            if (wire) {
                                wire.data('dragEnd').forEach(function (handler) {
                                    handler.apply(wire, args);
                                });
                            }
                        }
                        instance.groups.array.forEach(function (group) {
                            this.removeData(group.path());
                            updateWire(group, instance);
                        }.bind(this));

                        clearTimeout(this.data('dragTimeout'));

                        // update bindings coords when dragging done
                        function updateBindings(comp) {
                            function updateBindingCoords(binding) {
                                var elem = factory.editor.select('.binding[data-path="'+binding.path()+'"]');
                                if (elem) {
                                    elem.data('dragEnd').forEach(function (handler) {
                                        handler.apply(elem, args);
                                    });
                                }
                            }

                            comp.provided.array.forEach(function (port) {
                                port.bindings.array.forEach(updateBindingCoords);
                            });

                            comp.required.array.forEach(function (port) {
                                port.bindings.array.forEach(updateBindingCoords);
                            });
                        }
                        instance.components.array.forEach(updateBindings);
                        instance.hosts.array.forEach(function redrawChild(child) {
                            child.components.array.forEach(updateBindings);
                            child.groups.array.forEach(function (group) {
                                updateWire(group, child);
                            });
                            child.hosts.array.forEach(redrawChild);
                        });

                        this.removeData('dragTimeout');
                        this.removeData('hoveredNode');
                        this.removeData('offset');
                    });

                if (instance.host) {
                    var host = this.editor.select('.node[data-path="'+instance.host.path()+'"]');
                    var children = host.selectAll('.node[data-path="'+instance.host.path()+'"] > .instance').items;
                    var dx = (host.select('.bg').asPX('width') - computedWidth) / 2,
                        dy = NODE_HEIGHT;
                    children.forEach(function (child) {
                        dy += child.select('.bg').asPX('height') + 10;
                    });
                    host.append(node);
                    node.transform('t'+dx+','+dy);
                } else {
                    node.relocate(instance);
                }

                return node;
            },

            createComponent: function (instance) {
                this.removeUIElem(instance.path());
                updateSVGDefs(this.model);

                var host = this.editor.select('.instance[data-path="'+instance.eContainer().path()+'"]');
                var computedWidth = host.select('.bg').asPX('width') - 20,
                    computedHeight = getCompUIHeight(instance);
                var hostHeight = kModelHelper.getNodeTreeHeight(instance.eContainer());
                var bg = this.editor
                    .rect(0, 0, computedWidth, computedHeight, 3)
                    .attr({
                        fill: 'black',
                        fillOpacity: isTruish(instance.started) ? 1 : 0.65,
                        stroke: 'white',
                        strokeWidth: 1.5,
                        'class': 'bg'
                    });

                var nameText = this.editor
                    .text(computedWidth/2, computedHeight/2, instance.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#comp-clip-'+hostHeight+')'
                    });

                var tdefText = this.editor
                    .text(computedWidth/2, (computedHeight/2)+12, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#comp-clip-'+hostHeight+')'
                    });

                var comp = this.editor
                    .group()
                    .attr({'class': 'instance comp', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText);

                var PORT_X_PADDING = 24,
                    providedDy = 0,
                    requiredDy = 0;
                instance.typeDefinition.provided.array.forEach(function (portType) {
                    var portPlug = this.editor
                        .circle(0, (COMP_HEIGHT/2) - 5, 11)
                        .attr({
                            fill: '#bc7645',
                            stroke: '#ECCA40',
                            strokeWidth: 2
                        })
                        .mouseover(function () {
                            this.attr({ strokeWidth: 3 });
                        })
                        .mouseout(function () {
                            this.attr({ strokeWidth: 2 });
                        })
                        .mousedown(function (evt) {
                            evt.cancelBubble = true;
                        })
                        .touchstart(function (evt) {
                            evt.cancelBubble = true;
                        })
                        .drag(
                        function (dx, dy) {
                            var portPos = this.data('portPos');
                            var middle = { x: 0, y: 0 };
                            if (portPos.x > (portPos.x + dx)) {
                                middle.x = (portPos.x + dx) + (portPos.x - (portPos.x + dx))/2;
                            } else {
                                middle.x = portPos.x + ((portPos.x + dx) - portPos.x)/2;
                            }

                            middle.y = ((portPos.y >= (portPos.y + dy)) ? portPos.y : (portPos.y + dy)) + 20;
                            this.data('binding').attr({
                                d: 'M'+portPos.x+','+portPos.y+' Q'+middle.x+','+middle.y+' '+(portPos.x + dx)+','+(portPos.y + dy)
                            });

                            clearTimeout(this.data('bindingTimeout'));
                            var chanElem = this.data('hoveredChan');
                            if (chanElem) {
                                chanElem.select('.bg').removeClass('hovered error');
                            }

                            var timeout = setTimeout(function () {
                                var chanElem = factory.getHoveredChan(portPos.x + dx, portPos.y + dy);
                                if (chanElem) {
                                    this.data('hoveredChan', chanElem);
                                    var chanBg = chanElem.select('.bg');
                                    chanBg.addClass('hovered');

                                    var chan = factory.model.findByPath(chanElem.attr('data-path'));
                                    if (kModelHelper.isAlreadyBound(instance.findProvidedByID(portType.name), chan)) {
                                        chanBg.addClass('error');
                                    }
                                } else {
                                    this.data('hoveredChan', null);
                                }
                            }.bind(this), 100);
                            this.data('bindingTimeout', timeout);
                        },
                        function () {
                            var portM = port.transform().localMatrix,
                                compBox = getAbsoluteBBox(comp);
                            var portPos = {
                                x: portM.e + compBox.x,
                                y: portM.f + compBox.y + (COMP_HEIGHT/2) - 5
                            };
                            this.data('portPos', portPos);
                            var binding = factory.editor
                                .path('M'+portPos.x+','+portPos.y+' '+portPos.x+','+portPos.y)
                                .attr({
                                    fill: 'none',
                                    stroke: '#ECCA40',
                                    strokeWidth: 5,
                                    strokeLineCap: 'round',
                                    strokeLineJoin: 'round',
                                    opacity: 0.7
                                });
                            this.data('binding', binding);
                        },
                        function () {
                            clearTimeout(this.data('bindingTimeout'));

                            var hoveredChan = this.data('hoveredChan');
                            if (hoveredChan) {
                                if (!hoveredChan.select('.bg').hasClass('error')) {
                                    var chan = factory.model.findByPath(hoveredChan.attr('data-path'));
                                    if (chan) {
                                        var port = instance.findProvidedByID(portType.name);
                                        if (!port) {
                                            port = kFactory.createPort();
                                            port.name = portType.name;
                                            port.portTypeRef = portType;
                                            instance.addProvided(port);
                                        }

                                        var binding = kFactory.createMBinding();
                                        binding.hub = chan;
                                        binding.port = port;
                                        factory.model.addMBindings(binding);
                                    }
                                }

                                // remove ui feedback
                                hoveredChan.select('.bg').removeClass('hovered error');
                            }

                            this.data('binding').remove();

                            this.removeData('binding');
                            this.removeData('bindingTimeout');
                            this.removeData('hoveredChan');
                            this.removeData('portPos');
                        });

                    var text = this.editor
                        .text(0, COMP_HEIGHT - 4, portType.name.substr(0, (portType.name.length > 5) ? 5:portType.name.length))
                        .attr({
                            fill: 'white',
                            textAnchor: 'middle',
                            title: portType.name
                        })
                        .append(Snap.parse('<title>'+portType.name+'</title>'));

                    var port = this.editor
                        .group()
                        .attr({
                            'class': 'port provided',
                            'data-name': portType.name
                        })
                        .append(portPlug)
                        .append(text)
                        .transform('t'+PORT_X_PADDING+','+providedDy);

                    comp.append(port);

                    providedDy += COMP_HEIGHT;
                }.bind(this));

                instance.typeDefinition.required.array.forEach(function (portType) {
                    var portPlug = this.editor
                        .circle(0, (COMP_HEIGHT/2) - 5, 11)
                        .attr({
                            fill: '#bc7645',
                            stroke: '#C60808',
                            strokeWidth: 2
                        })
                        .mouseover(function () {
                            this.attr({ strokeWidth: 3 });
                        })
                        .mouseout(function () {
                            this.attr({ strokeWidth: 2 });
                        })
                        .mousedown(function (evt) {
                            evt.cancelBubble = true;
                        })
                        .touchstart(function (evt) {
                            evt.cancelBubble = true;
                        })
                        .drag(
                        function (dx, dy) {
                            var portPos = this.data('portPos');
                            var middle = { x: 0, y: 0 };
                            if (portPos.x > (portPos.x + dx)) {
                                middle.x = (portPos.x + dx) + (portPos.x - (portPos.x + dx))/2;
                            } else {
                                middle.x = portPos.x + ((portPos.x + dx) - portPos.x)/2;
                            }

                            middle.y = ((portPos.y >= (portPos.y + dy)) ? portPos.y : (portPos.y + dy)) + 20;
                            this.data('binding').attr({
                                d: 'M'+portPos.x+','+portPos.y+' Q'+middle.x+','+middle.y+' '+(portPos.x + dx)+','+(portPos.y + dy)
                            });

                            clearTimeout(this.data('bindingTimeout'));
                            var chanElem = this.data('hoveredChan');
                            if (chanElem) {
                                chanElem.select('.bg').removeClass('hovered error');
                            }

                            var timeout = setTimeout(function () {
                                var chanElem = factory.getHoveredChan(portPos.x + dx, portPos.y + dy);
                                if (chanElem) {
                                    this.data('hoveredChan', chanElem);
                                    var chanBg = chanElem.select('.bg');
                                    chanBg.addClass('hovered');

                                    var chan = factory.model.findByPath(chanElem.attr('data-path'));
                                    if (kModelHelper.isAlreadyBound(instance.findRequiredByID(portType.name), chan)) {
                                        chanBg.addClass('error');
                                    }
                                } else {
                                    this.data('hoveredChan', null);
                                }
                            }.bind(this), 100);
                            this.data('bindingTimeout', timeout);
                        },
                        function () {
                            var portM = port.transform().localMatrix,
                                compBox = getAbsoluteBBox(comp);
                            var portPos = {
                                x: portM.e + compBox.x,
                                y: portM.f + compBox.y + (COMP_HEIGHT/2) - 5
                            };
                            this.data('portPos', portPos);
                            var binding = factory.editor
                                .path('M'+portPos.x+','+portPos.y+' '+portPos.x+','+portPos.y)
                                .attr({
                                    fill: 'none',
                                    stroke: '#C60808',
                                    strokeWidth: 5,
                                    strokeLineCap: 'round',
                                    strokeLineJoin: 'round',
                                    opacity: 0.7
                                });
                            this.data('binding', binding);
                        },
                        function () {
                            clearTimeout(this.data('bindingTimeout'));

                            var hoveredChan = this.data('hoveredChan');
                            if (hoveredChan) {
                                if (!hoveredChan.select('.bg').hasClass('error')) {
                                    var chan = factory.model.findByPath(hoveredChan.attr('data-path'));
                                    if (chan) {
                                        var port = instance.findRequiredByID(portType.name);
                                        if (!port) {
                                            port = kFactory.createPort();
                                            port.name = portType.name;
                                            port.portTypeRef = portType;
                                            instance.addRequired(port);
                                        }

                                        var binding = kFactory.createMBinding();
                                        binding.hub = chan;
                                        binding.port = port;
                                        factory.model.addMBindings(binding);
                                    }
                                }

                                // remove ui feedback
                                hoveredChan.select('.bg').removeClass('hovered error');
                            }

                            this.data('binding').remove();

                            this.removeData('binding');
                            this.removeData('bindingTimeout');
                            this.removeData('hoveredChan');
                            this.removeData('portPos');
                        });

                    var text = this.editor
                        .text(0, COMP_HEIGHT - 4, portType.name.substr(0, (portType.name.length > 5) ? 5:portType.name.length))
                        .attr({
                            fill: 'white',
                            textAnchor: 'middle',
                            title: portType.name
                        })
                        .append(Snap.parse('<title>'+portType.name+'</title>'));

                    var port = this.editor
                        .group()
                        .attr({
                            'class': 'port required',
                            'data-name': portType.name
                        })
                        .append(portPlug)
                        .append(text)
                        .transform('t'+(computedWidth - PORT_X_PADDING)+','+requiredDy);

                    comp.append(port);

                    requiredDy += COMP_HEIGHT;
                }.bind(this));

                comp.selectable()
                    .draggable()
                    .dragStart(function () {
                        var container = document.getElementById('editor-container');
                        this.data('offset', { left: container.offsetLeft, top: container.offsetTop });
                    })
                    .firstDragMove(function () {
                        var args = arguments;

                        this.data('parentNode', instance.eContainer());
                        instance.eContainer().removeComponents(instance);

                        // redraw bindings after component when dragging start
                        var redrawBindings = function (port) {
                            port.bindings.array.forEach(function (binding) {
                                var elem = factory.editor.select('.binding[data-path="'+binding.path()+'"]');
                                if (elem) {
                                    elem.data('firstDragMove').forEach(function (handler) {
                                        handler.apply(elem, args);
                                    });
                                }
                            });
                        }.bind(this);
                        instance.provided.array.forEach(redrawBindings);
                        instance.required.array.forEach(redrawBindings);
                    })
                    .dragMove(function (dx, dy, clientX, clientY) {
                        var args = arguments;

                        // ui-error feedback
                        clearTimeout(this.data('dragTimeout'));
                        var nodeElem = this.data('hoveredNode');
                        if (nodeElem) {
                            nodeElem.select('.bg').removeClass('hovered error');
                        }

                        var timeout = setTimeout(function () {
                            var offset = this.data('offset');
                            var nodeElem = factory.getHoveredNode(clientX - offset.left, clientY - offset.top, instance.path());
                            if (nodeElem) {
                                this.data('hoveredNode', nodeElem);
                                nodeElem.select('.bg').addClass('hovered');
                            } else {
                                this.data('hoveredNode', null);
                            }
                        }.bind(this), 100);
                        this.data('dragTimeout', timeout);

                        // redraw bindings when dragging
                        var redrawBindings = function (port) {
                            port.bindings.array.forEach(function (binding) {
                                var elem = factory.editor.select('.binding[data-path="'+binding.path()+'"]');
                                if (elem) {
                                    elem.data('startPtDrag').apply(elem, args);
                                }
                            });
                        }.bind(this);
                        instance.provided.array.forEach(redrawBindings);
                        instance.required.array.forEach(redrawBindings);
                    })
                    .dragEnd(function () {
                        var hoveredNode = this.data('hoveredNode');
                        if (hoveredNode) {
                            // remove ui-feedback classes
                            hoveredNode.select('.bg').removeClass('hovered error');

                            comp.remove();
                            factory.model.findByPath(hoveredNode.attr('data-path')).addComponents(instance);
                        } else {
                            // if dropped in "nothing" then put it back into its old host node
                            comp.remove();
                            this.data('parentNode').addComponents(instance);
                        }

                        clearTimeout(this.data('dragTimeout'));

                        this.removeData('parentNode');
                        this.removeData('offset');
                        this.removeData('hoveredNode');
                        this.removeData('dragTimeout');
                    }
                );

                var children = host.selectAll('.instance[data-path="'+instance.eContainer().path()+'"] > .instance').items;
                var dx = (host.select('.bg').asPX('width') - computedWidth) / 2,
                    dy = NODE_HEIGHT;
                children.forEach(function (child) {
                    dy += child.select('.bg').asPX('height') + 10;
                });
                comp.transform('t'+dx+','+dy);
                host.append(comp);

                return comp;
            },

            createBinding: function (binding) {
                if (binding.hub && binding.port) {
                    var portElem = this.editor.select('.comp[data-path="'+binding.port.eContainer().path()+'"] .port[data-name="'+binding.port.name+'"]'),
                        chanElem = this.editor.select('.chan[data-path="'+binding.hub.path()+'"]'),
                        bindingElem = this.editor.select('.binding[data-path="'+binding.path()+'"]');

                    if (portElem && chanElem) {
                        var coords = computeBindingCoords(portElem, chanElem);
                        if (bindingElem) {
                            bindingElem.data('coords', coords);
                            bindingElem
                                .select('.bg')
                                .attr({
                                    d: 'M'+coords.port.x+','+coords.port.y+' Q'+coords.middle.x+','+coords.middle.y+' '+coords.chan.x+','+coords.chan.y
                                });
                        } else {
                            var bindingBg = this.editor
                                .path('M'+coords.port.x+','+coords.port.y+' Q'+coords.middle.x+','+coords.middle.y+' '+coords.chan.x+','+coords.chan.y)
                                .attr({
                                    fill: 'none',
                                    stroke: (binding.port.getRefInParent() === 'provided') ? '#ECCA40' : '#C60808',
                                    strokeWidth: 5,
                                    strokeLineCap: 'round',
                                    strokeLineJoin: 'round',
                                    opacity: 0.7,
                                    'class': 'bg'
                                })
                                .mouseover(function () {
                                    this.attr({opacity: 0.85, strokeWidth: 6});
                                })
                                .mouseout(function () {
                                    this.attr({opacity: 0.7, strokeWidth: 5});
                                });

                            this.editor
                                .group()
                                .attr({
                                    'class': 'binding',
                                    'data-path': binding.path()
                                })
                                .data('coords', coords)
                                .append(bindingBg)
                                .selectable()
                                .firstDragMove(function () {
                                    this.appendTo(factory.editor);
                                })
                                .startPtDrag(function (dx, dy) {
                                    var coords = this.data('coords');
                                    var portDx = coords.port.x + dx,
                                        portDy = coords.port.y + dy;

                                    if (portDx > coords.chan.x) {
                                        coords.middle.x = coords.chan.x + (portDx - coords.chan.x)/2;
                                    } else {
                                        coords.middle.x = portDx + (coords.chan.x - portDx)/2;
                                    }

                                    coords.middle.y = ((portDy >= coords.chan.y) ? portDy : coords.chan.y) + 20;

                                    bindingBg.attr({
                                        d: 'M'+portDx+','+portDy+' Q'+coords.middle.x+','+coords.middle.y+' '+coords.chan.x+','+coords.chan.y
                                    });
                                })
                                .endPtDrag(function (dx, dy) {
                                    var coords = this.data('coords');
                                    var chanDx = coords.chan.x + dx,
                                        chanDy = coords.chan.y + dy;

                                    if (coords.port.x > chanDx) {
                                        coords.middle.x = chanDx + (coords.port.x - chanDx)/2;
                                    } else {
                                        coords.middle.x = coords.port.x + (chanDx - coords.port.x)/2;
                                    }

                                    coords.middle.y = ((coords.port.y >= chanDy) ? coords.port.y : chanDy) + 20;

                                    bindingBg.attr({
                                        d: 'M'+coords.port.x+','+coords.port.y+' Q'+coords.middle.x+','+coords.middle.y+' '+chanDx+','+chanDy
                                    });
                                })
                                .dragEnd(function () {
                                    var portElem = factory.editor.select(
                                            '.comp[data-path="'+binding.port.eContainer().path()+'"] ' +
                                            '.port[data-name="'+binding.port.name+'"]'),
                                        chanElem = factory.editor.select('.chan[data-path="'+binding.hub.path()+'"]');
                                    this.data('coords', computeBindingCoords(portElem, chanElem));
                                });
                        }
                    }
                }
            },

            createChannel: function (instance) {
                this.removeUIElem(instance.path());
                updateSVGDefs(this.model);

                var bg = this.editor
                    .circle(0, 0, CHANNEL_RADIUS)
                    .attr({
                        fill: '#d57129',
                        stroke: '#fff',
                        strokeWidth: 3,
                        'class': 'bg',
                        opacity: 0.75
                    });

                var nameText = this.editor
                    .text(0, -5, instance.name)
                    .attr({
                        fill: isTruish(instance.started) ? '#fff' : '#000',
                        textAnchor: 'middle',
                        'class': 'name',
                        'clip-path': 'url(#chan-clip)'
                    });

                var tdefText = this.editor
                    .text(0, 10, instance.typeDefinition.name)
                    .attr({
                        fill: 'white',
                        textAnchor: 'middle',
                        'clip-path': 'url(#chan-clip)'
                    });

                return this.editor
                    .group()
                    .attr({'class': 'instance chan', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .selectable()
                    .draggable()
                    .dragMove(function () {
                        var args = arguments;
                        instance.bindings.array.forEach(function (binding) {
                            //factory.createBinding(binding);
                            var elem = factory.editor.select('.binding[data-path="'+binding.path()+'"]');
                            elem.data('endPtDrag').apply(elem, args);
                        });
                    })
                    .dragEnd(function () {
                        var args = arguments;

                        // update bindings coords when done
                        instance.bindings.array.forEach(function (binding) {
                            var elem = factory.editor.select('.binding[data-path="'+binding.path()+'"]');
                            if (elem) {
                                elem.data('dragEnd').forEach(function (handler) {
                                    handler.apply(elem, args);
                                });
                            }
                        });
                    })
                    .relocate(instance);
            },

            deleteInstance: function (parent, path) {
                var elem = this.editor.select('.instance[data-path="'+path+'"]');
                if (elem) {
                    if (elem.hasClass('comp') || elem.hasClass('node')) {
                        var highestNodePath = getHighestNodePath(elem);
                        if (factory.draggedInstancePath === path) {
                            // append it to the editor
                            this.editor.append(elem);
                        } else {
                            this.editor.selectAll('.group-wire[data-to="'+path+'"]').remove();
                            elem.remove();
                        }

                        factory.refreshNode(highestNodePath);

                        // refresh all group-wire from this whole node
                        var highestNode = factory.model.findByPath(highestNodePath);
                        if (highestNode) {
                            highestNode.groups.array.forEach(function (group) {
                                factory.createGroupWire(group, highestNode);
                            });
                            highestNode.hosts.array.forEach(function redrawWire(child) {
                                child.groups.array.forEach(function (group) {
                                    factory.createGroupWire(group, child);
                                });
                                child.hosts.array.forEach(redrawWire);
                            });

                            // redraw parent bindings
                            highestNode.components.array.forEach(function (comp) {
                                comp.provided.array.forEach(function (port) {
                                    port.bindings.array.forEach(function (binding) {
                                        factory.createBinding(binding);
                                    });
                                });
                                comp.required.array.forEach(function (port) {
                                    port.bindings.array.forEach(function (binding) {
                                        factory.createBinding(binding);
                                    });
                                });
                            });

                            // redraw sibling bindings
                            highestNode.hosts.array.forEach(function redrawBindings(child) {
                                child.components.array.forEach(function (comp) {
                                    comp.provided.array.forEach(function (port) {
                                        port.bindings.array.forEach(function (binding) {
                                            factory.createBinding(binding);
                                        });
                                    });
                                    comp.required.array.forEach(function (port) {
                                        port.bindings.array.forEach(function (binding) {
                                            factory.createBinding(binding);
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
                factory.invokeListener();
            },

            deleteGroupWire: function (groupPath, nodePath) {
                var elem = this.editor.select('.group-wire[data-from="'+groupPath+'"][data-to="'+nodePath+'"]');
                if (elem) {
                    elem.remove();
                }
            },

            deleteBinding: function (bindingPath) {
                var elem = this.editor.select('.binding[data-path="'+bindingPath+'"]');
                if (elem) {
                    elem.remove();
                }
            },

            deleteSelected: function () {
                var selected = this.getSelected();
                selected.forEach(function (elem) {
                    var path = elem.attr('data-path');
                    if (path) {
                        var instance = factory.model.findByPath(path);
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
                            var grp = factory.model.findByPath(elem.attr('data-from')),
                                node = factory.model.findByPath(elem.attr('data-to'));
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

            removeUIElem: function (path) {
                var elem = this.editor.select('.instance[data-path="'+path+'"]');
                if (elem) {
                    elem.remove();
                }
            },

            deleteNodes: function () {
                this.editor.selectAll('.node').remove();
                this.editor.selectAll('.group-wire').remove();
                factory.invokeListener();
            },

            deleteGroups: function () {
                this.editor.selectAll('.group').remove();
                this.editor.selectAll('.group-wire').remove();
                factory.invokeListener();
            },

            deleteChannels: function () {
                this.editor.selectAll('.chan').remove();
                factory.invokeListener();
            },

            deleteBindings: function () {
                this.editor.selectAll('.binding').remove();
                factory.invokeListener();
            },

            updateInstance: function (previousPath, instance) {
                var elem = this.editor.select('.instance[data-path="'+previousPath+'"]');
                if (elem) {
                    // update data-path and name
                    elem.attr({ 'data-path': instance.path() })
                        .select('text.name')
                        .attr({ text: instance.name });

                    // update location only if not a child of someone
                    if (!elem.parent().hasClass('node')) {
                        elem.relocate(instance);
                    }

                    // update children data-path if any
                    if (instance.components || instance.hosts) {
                        instance.components.array.forEach(function (comp) {
                            var compElem = elem.select('.instance[data-path="'+previousPath+'/components['+comp.name+']"]');
                            if (compElem) {
                                compElem.attr({ 'data-path': comp.path().replace(previousPath, instance.path()) });
                            }
                        });
                    }

                    // update started state
                    if (elem.hasClass('comp')) {
                        elem.select('.bg')
                            .attr({ fillOpacity: isTruish(instance.started) ? 1 : 0.65 });
                    } else {
                        elem.select('text.name')
                            .attr({ fill: isTruish(instance.started) ? '#fff' : '#000' });
                    }

                    // update group-wire if it is a node
                    if (elem.hasClass('node')) {
                        this.editor
                            .selectAll('.group-wire[data-to="'+previousPath+'"]')
                            .attr({ 'data-to': instance.path() });
                    }

                    if (elem.hasClass('group')) {
                        this.editor
                            .selectAll('.group-wire[data-from="'+previousPath+'"]')
                            .attr({ 'data-from': instance.path() });
                    }
                }
            },

            updateCompTypeDefinition: function (comp, oldTypeDef) {
                // get rid of the old bindings (if any) related to old type def
                var compare = kFactory.createModelCompare();
                var diff = compare.diff(oldTypeDef, comp.typeDefinition);
                var portType, port;
                diff.traces.array.forEach(function (trace) {
                    if (trace.traceType.name() === 'REMOVE') {
                        switch (trace.refName) {
                            case 'provided':
                                // remove of a provided port
                                portType = factory.model.findByPath(trace.objPath);
                                port = comp.findProvidedByID(portType.name);
                                if (port) {
                                    port.delete();
                                }
                                break;

                            case 'required':
                                // remove of a required port
                                portType = factory.model.findByPath(trace.objPath);
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
                                portType = factory.model.findByPath(trace.previousPath);
                                port = kFactory.createPort();
                                port.name = portType.name;
                                port.portTypeRef = portType;
                                comp.addProvided(port);
                                break;

                            case 'required':
                                // add a required port
                                portType = factory.model.findByPath(trace.previousPath);
                                port = kFactory.createPort();
                                port.name = portType.name;
                                port.portTypeRef = portType;
                                comp.addRequired(port);
                                break;
                        }

                    }
                });

                // recreate the new component
                factory.createComponent(comp);
            },

            /**
             * Refresh a node's UI (and it's children too)
             * @param path
             */
            refreshNode: function (path) {
                var instance = factory.model.findByPath(path);
                if (instance) {
                    var node = factory.editor.select('.node[data-path="'+path+'"]');
                    var treeHeight = kModelHelper.getNodeTreeHeight(instance);
                    var computedWidth = NODE_WIDTH+(20*treeHeight);
                    if (instance.host) {
                        computedWidth = NODE_WIDTH+(20*(kModelHelper.getNodeTreeHeight(instance.host)-1));
                    }

                    node.relocate(instance);

                    node.select('.bg').attr({
                        width: computedWidth,
                        height: getNodeUIHeight(instance)
                    });

                    factory.editor
                        .selectAll('.node[data-path="'+path+'"] > text')
                        .attr({
                            x: computedWidth/2,
                            'clip-path': 'url(#node-clip-'+treeHeight+')'
                        });

                    instance.components.array.forEach(function (comp) {
                        factory.refreshComp(comp.path());
                    });

                    instance.hosts.array.forEach(function (host) {
                        factory.refreshNode(host.path());
                    });

                    // apply dx,dy transformation of level-1 children
                    var children = factory.editor.selectAll('.node[data-path="'+instance.path()+'"] > .instance').items;
                    var dy = NODE_HEIGHT;
                    children.forEach(function (child) {
                        child.transform('t'+((computedWidth - child.select('.bg').asPX('width'))/2)+','+dy);
                        dy += child.select('.bg').asPX('height') + 10;
                    });
                }
            },

            /**
             *
             * @param path
             */
            refreshComp: function (path) {
                var instance = factory.model.findByPath(path);
                if (instance) {
                    var comp = factory.editor.select('.comp[data-path="'+path+'"]');
                    var host = factory.editor.select('.node[data-path="'+instance.eContainer().path()+'"]');
                    var treeHeight = kModelHelper.getNodeTreeHeight(instance.eContainer());
                    var computedWidth = host.select('.bg').asPX('width') - 20;

                    if (comp && host) {
                        comp.select('.bg').attr({ width: computedWidth });
                        factory.editor
                            .selectAll('.comp[data-path="'+path+'"] > text')
                            .attr({
                                x: computedWidth/2,
                                'clip-path': 'url(#comp-clip-'+treeHeight+')'
                            });

                        var PORT_X_PADDING = 24;
                        instance.typeDefinition.required.array.forEach(function (portType) {
                            var port = comp.select('.required[data-name="'+portType.name+'"]');
                            port.transform('t'+(computedWidth - PORT_X_PADDING)+','+port.transform().localMatrix.f);
                        });
                    }
                }
            },

            getSelected: function () {
                return this.editor
                    .selectAll('.selected').items
                    .map(function (elem) {
                        // all selected element are in groups so we need to return the parent
                        return elem.parent();
                    });
            },

            getSelectedNodes: function () {
                return this.editor
                    .selectAll('.node > .selected').items
                    .map(function (bg) {
                        return bg.parent();
                    });
            },

            getNodePathAtPoint: function (x, y) {
                var container = this.getEditorContainer();
                var node = factory.getHoveredNode(x-container.offsetLeft, y-container.offsetTop);
                if (node) {
                    return node.attr('data-path');
                } else {
                    return null;
                }
            },

            getEditorContainer: function () {
                return document.getElementById('editor-container');
            },

            setSelectedListener: function (listener) {
                this.listener = listener;
            },

            selectAll: function () {
                this.editor.selectAll('.bg').items.forEach(function (elem) {
                    elem.addClass('selected');
                });
            },

            isSelected: function (path) {
                var elem = this.editor.select('.instance[data-path="'+path+'"]');
                if (elem) {
                    if (elem.select('.bg').hasClass('selected')) {
                        return true;
                    }
                }

                return false;
            },

            setDropTarget: function (elem) {
                this.dropTarget = elem;
            },

            getDropTarget: function () {
                return this.dropTarget;
            },

            setModel: function (model) {
                this.model = model;
                if (this.editor) {
                    updateSVGDefs(model);

                    this.editor.clear();
                    factory.invokeListener();
                }
            },

            getHoveredNode: function (x, y, bannedPath) {
                return this.editor
                    .selectAll('.node').items
                    .filter(function (node) {
                        if (bannedPath) {
                            return node.attr('data-path') !== bannedPath &&
                                isPointInsideElem(node, x, y);
                        } else {
                            return isPointInsideElem(node, x, y);
                        }
                    })
                    .sort(function (a, b) {
                        return a.getBBox().width - b.getBBox().width;
                    })[0];
            },

            getHoveredChan: function (x, y) {
                var chans = this.editor
                    .selectAll('.chan').items;
                for (var i=0; i < chans.length; i++) {
                    if (Snap.path.isPointInsideBBox(chans[i].getBBox(), x, y)) {
                        return chans[i];
                    }
                }
                return null;
            },
            
            invokeListener: function (selected) {
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
            }
        };

        /**
         *
         */
        Snap.plugin(function (Snap, Element) {
            var dragStart = function (x, y, evt) {
                this.data('dragStartX', x);
                this.data('dragStartY', y);

                factory.draggedInstancePath = this.attr('data-path');

                var handlers = this.data('dragStart');
                if (handlers) {
                    handlers.forEach(function (handler) {
                        handler.apply(this, [x, y, evt]);
                    }.bind(this));
                }

                if (this.hasClass('comp') || this.hasClass('node')) {
                    var bbox = getAbsoluteBBox(this);
                    this.data('ot', 't'+bbox.x+','+bbox.y);
                } else {
                    this.data('ot', this.transform().local);
                }

                this.data('hasMoved', false);
            };

            var dragMove = function (dx, dy, x, y, evt) {
                if((typeof dx === 'object') && ( dx.type === 'touchmove')) {
                    evt = dx;
                    x = evt.changedTouches[0].clientX;
                    y = evt.changedTouches[0].clientY;
                    dx = x - this.data('dragStartX');
                    dy = y - this.data('dragStartY');
                }

                this.transform(this.data('ot') + (this.data('ot') ? 'T':'t') + [ dx, dy ]);

                if (this.data('hasMoved')) {
                    var handlers = this.data('dragMove');
                    if (handlers) {
                        handlers.forEach(function (handler) {
                            handler.apply(this, [dx, dy, x, y, evt]);
                        }.bind(this));
                    }
                } else {
                    this.data('hasMoved', true);
                    var firstDragMoveHandlers = this.data('firstDragMove');
                    if (firstDragMoveHandlers) {
                        firstDragMoveHandlers.forEach(function (handler) {
                            handler.apply(this, [dx, dy, x, y, evt]);
                        }.bind(this));
                    }
                }
            };

            var dragEnd = function () {
                var args = arguments;
                if (this.data('hasMoved')) {
                    // update position
                    var instance = factory.model.findByPath(this.attr('data-path'));
                    if (instance) {
                        // update model with new position on drag end
                        var pos = instance.findMetaDataByID(KWE_POSITION);
                        if (!pos) {
                            pos = kFactory.createValue();
                            pos.name = KWE_POSITION;
                            instance.addMetaData(pos);
                        }
                        var matrix = this.transform().localMatrix;
                        pos.value = JSON.stringify({ x: matrix.e, y: matrix.f });
                    }

                    // trigger handlers
                    var handlers = this.data('dragEnd');
                    if (handlers) {
                        handlers.forEach(function (handler) {
                            handler.apply(this, args);
                        }.bind(this));
                    }

                    this.data('hasMoved', false);
                }
                this.removeData('dragStartX');
                this.removeData('dragStartY');
                this.removeData('ot');
                factory.draggedInstancePath = null;
            };

            Element.prototype.draggable = function () {
                return this.drag(dragMove, dragStart, dragEnd);
            };

            Element.prototype.dragStart = function (handler) {
                var handlers = this.data('dragStart') || [];
                handlers.push(handler);
                return this.data('dragStart', handlers);
            };

            Element.prototype.dragEnd = function (handler) {
                var handlers = this.data('dragEnd') || [];
                handlers.push(handler);
                return this.data('dragEnd', handlers);
            };

            Element.prototype.dragMove = function (handler) {
                var handlers = this.data('dragMove') || [];
                handlers.push(handler);
                return this.data('dragMove', handlers);
            };

            Element.prototype.startPtDrag = function (handler) {
                return this.data('startPtDrag', handler);
            };

            Element.prototype.endPtDrag = function (handler) {
                return this.data('endPtDrag', handler);
            };

            Element.prototype.firstDragMove = function (handler) {
                var handlers = this.data('firstDragMove') || [];
                handlers.push(handler);
                return this.data('firstDragMove', handlers);
            };

            Element.prototype.touchable = function () {
                return this
                    .touchstart(dragStart)
                    .touchend(dragEnd)
                    .touchmove(dragMove);
            };

            Element.prototype.selectable = function () {
                var selectable = function (evt) {
                    evt.cancelBubble = true;

                    if (!evt.ctrlKey && !evt.shiftKey) {
                        factory.editor.selectAll('.selected').forEach(function (elem) {
                            elem.removeClass('selected');
                        });
                    }
                    if (evt.ctrlKey || evt.shiftKey) {
                        this.select('.bg').toggleClass('selected');

                    } else {
                        this.select('.bg').addClass('selected');
                    }
                    if (factory.listener) {
                        var selected = factory.editor.selectAll('.selected').items;
                        if (selected.length === 1) {
                            factory.listener(selected[0].parent().attr('data-path'));
                        } else {
                            factory.listener();
                        }
                    }
                };

                return this
                    .mousedown(selectable)
                    .touchstart(selectable);
            };

            Element.prototype.relocate = function (instance) {
                var meta = instance.findMetaDataByID(KWE_POSITION);
                var pos = { x: 100, y: 100 };
                if (meta) {
                    try {
                        pos = JSON.parse(meta.value);
                    } catch (ignore) {
                        pos = { x: 100, y: 100 };
                    }
                } else {
                    meta = kFactory.createValue();
                    meta.name = KWE_POSITION;
                    meta.value = JSON.stringify(pos);
                    instance.addMetaData(meta);
                }
                return this.transform('t'+pos.x+','+pos.y);
            };
        });

        /**
         *
         * @param node
         * @returns {number}
         */
        function getNodeUIHeight(node) {
            var height = NODE_HEIGHT; // minimum node height

            node.components.array.forEach(function (comp) {
                height += getCompUIHeight(comp) + 10;
            });

            node.hosts.array.forEach(function (child) {
                height += getNodeUIHeight(child) + 10;
            });

            return height;
        }

        function getCompUIHeight(comp) {
            if (comp.typeDefinition.provided.size() === 0 && comp.typeDefinition.required.size() === 0) {
                return COMP_HEIGHT;
            } else if (comp.typeDefinition.provided.size() > comp.typeDefinition.required.size()) {
                return COMP_HEIGHT * comp.typeDefinition.provided.size();
            } else {
                return COMP_HEIGHT * comp.typeDefinition.required.size();
            }
        }

        /**
         * Returns the highest node path regarding the given SVG element (supposed to be a .node or a .comp)
         * @param elem
         */
        function getHighestNodePath(elem) {
            if (elem.parent().hasClass('instance')) {
                return getHighestNodePath(elem.parent());
            } else {
                return elem.attr('data-path');
            }
        }

        /**
         *
         * @param elem
         * @returns {{x, y, x2, y2, width, height, cx, cy}|*}
         */
        function getAbsoluteBBox(elem) {
            var bbox = elem.getBBox();

            function walkUp(elem) {
                if (elem.parent() && elem.parent().hasClass('instance')) {
                    var parentBox = elem.parent().getBBox();
                    bbox.x += parentBox.x;
                    bbox.y += parentBox.y;
                    walkUp(elem.parent());
                }
            }
            walkUp(elem);
            return bbox;
        }

        /**
         *
         * @param elem
         * @param x
         * @param y
         */
        function isPointInsideElem(elem, x, y) {
            var bbox = getAbsoluteBBox(elem);
            return  x >= bbox.x &&
                x <= bbox.x + bbox.width &&
                y >= bbox.y &&
                y <= bbox.y + bbox.height;
        }

        function computeWireNodeAnchor(from, to, width, height) {
            function getHorizontalAlignment() {
                if (from.x >= to.x + width/3 && from.x <= to.x + (width/3)*2) {
                    return 'middle';


                } else if (from.x > to.x + (width/3)*2) {
                    return 'right';

                } else {
                    return 'left';
                }
            }

            function getVerticalAlignment() {
                if (from.y >= to.y + height/3 && from.y <= to.y + (height/3)*2) {
                    return 'middle';

                } else  if (from.y > to.y + (height/3)*2) {
                    return 'bottom';

                } else {
                    return 'top';
                }
            }

            var alignment = getVerticalAlignment() + '-' + getHorizontalAlignment();
            switch (alignment) {
                default:
                case 'top-left':
                    return { x: to.x + 2, y: to.y + 2 };

                case 'top-middle':
                    return { x: to.x + width/2, y: to.y };

                case 'top-right':
                    return { x: to.x + width - 2, y: to.y + 2 };

                case 'middle-left':
                    return { x: to.x, y: to.y + height/2 };

                case 'middle-right':
                    return { x: to.x + width, y: to.y + height/2 };

                case 'bottom-left':
                    return { x: to.x + 2, y: to.y + height - 2 };

                case 'bottom-middle':
                    return { x: to.x + width/2, y: to.y + height };

                case 'bottom-right':
                    return { x: to.x + width - 2, y: to.y + height - 2 };
            }
        }

        function computeBindingCoords(portElem, chanElem) {
            var chanM = chanElem.transform().localMatrix,
                chan = { x: chanM.e, y: chanM.f + (CHANNEL_RADIUS/2)},
                compBox = getAbsoluteBBox(portElem.parent()),
                portM = portElem.transform().localMatrix,
                port = { x: compBox.x + portM.e, y: compBox.y + portM.f + 15 },
                middle = { x: 0, y: 0 };

            if (port.x > chan.x) {
                middle.x = chan.x + (port.x - chan.x)/2;
            } else {
                middle.x = port.x + (chan.x - port.x)/2;
            }

            middle.y = ((port.y >= chan.y) ? port.y : chan.y) + 20;

            return { chan: chan, port: port, middle: middle };
        }

        /**
         *
         * @param model
         */
        function updateSVGDefs(model) {
            var editor = document.getElementById('editor');
            if (editor) {
                var defs = editor.getElementsByTagName('defs')[0];
                var clipPath;
                if (!document.getElementById('group-clip')) {
                    clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'group-clip';
                    var grpCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    grpCircle.setAttribute('cx', 0+'');
                    grpCircle.setAttribute('cy', 0+'');
                    grpCircle.setAttribute('r', (GROUP_RADIUS-4)+'');
                    clipPath.appendChild(grpCircle);
                    defs.appendChild(clipPath);
                }

                if (!document.getElementById('chan-clip')) {
                    clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'chan-clip';
                    var chanCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    chanCircle.setAttribute('cx', 0+'');
                    chanCircle.setAttribute('cy', 0+'');
                    chanCircle.setAttribute('r', (CHANNEL_RADIUS-4)+'');
                    clipPath.appendChild(chanCircle);
                    defs.appendChild(clipPath);
                }

                var nodeTreeHeights = kModelHelper.getNodeTreeHeights(model.nodes.array);
                nodeTreeHeights.forEach(function (height) {
                    if (!document.getElementById('node-clip-'+height)) {
                        var nodeClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                        nodeClip.id = 'node-clip-'+height;
                        var nodeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        nodeRect.setAttribute('width', (NODE_WIDTH+(20*height)-5)+'');
                        nodeRect.setAttribute('height', '100%');
                        nodeRect.setAttribute('x', 2+'');
                        nodeRect.setAttribute('y', 0+'');
                        nodeClip.appendChild(nodeRect);
                        defs.appendChild(nodeClip);
                    }

                    if (!document.getElementById('comp-clip-'+height)) {
                        var compClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                        compClip.id = 'comp-clip-'+height;
                        var compRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        compRect.setAttribute('width', (NODE_WIDTH + (20*height) - 112)+'');
                        compRect.setAttribute('height', '100%');
                        compRect.setAttribute('x', 46+'');
                        compRect.setAttribute('y', 0+'');
                        compClip.appendChild(compRect);
                        defs.appendChild(compClip);
                    }
                });
            }
        }

        /**
         *
         * @param val
         * @returns {boolean}
         */
        function isTruish(val) {
            return (val === 'true' || val > 0 || val === true);
        }

        return factory;
    });