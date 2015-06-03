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
                    });
                plug.mouseover(function () {
                    this.attr({r: GROUP_PLUG_RADIUS+1});
                });
                plug.mouseout(function () {
                    this.attr({r: GROUP_PLUG_RADIUS});
                });

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
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable(instance)
                    .afterDragMove(function () {
                        instance.subNodes.array.forEach(function (subNode) {
                            var wire = factory.editor.select('.group-wire[data-from="'+instance.path()+'"][data-to="'+subNode.path()+'"]');
                            if (wire) {
                                var subNodeData = this.data(subNode.path());
                                if (!subNodeData) {
                                    var nodeElem = factory.editor.select('.node[data-path="'+subNode.path()+'"]');
                                    subNodeData = getAbsoluteBBox(nodeElem);
                                    this.data(subNode.path(), {
                                        x: subNodeData.x,
                                        y: subNodeData.y,
                                        width: nodeElem.select('.bg').asPX('width'),
                                        height: nodeElem.select('.bg').asPX('height')
                                    });
                                }

                                var localM = group.transform().localMatrix;
                                var coords = computeWirePathMiddlePts(
                                    { x: localM.e, y: localM.f + (GROUP_RADIUS/2) + GROUP_PLUG_RADIUS },
                                    { x: subNodeData.x, y: subNodeData.y },
                                    subNodeData.width,
                                    subNodeData.height);

                                wire.select('.bg')
                                    .attr({
                                        d: 'M'+coords.from.x+','+coords.from.y+' '+coords.to.x+','+coords.to.y
                                    });

                                wire.select('circle')
                                    .attr({
                                        cx: coords.to.x,
                                        cy: coords.to.y
                                    });
                            }
                        }.bind(this));
                    })
                    .dragEnd(function () {
                        instance.subNodes.array.forEach(function (subNode) {
                            this.removeData(subNode.path());
                        }.bind(this));
                    })
                    .relocate(instance);

                plug.mousedown(function (evt) {
                    evt.preventDefault();
                    evt.cancelBubble = true;


                }.bind(this));

                return group;
            },

            createGroupWire: function (group, node) {
                var grpElem = factory.editor.select('.group[data-path="'+group.path()+'"]'),
                    nodeElem = this.editor.select('.node[data-path="'+node.path()+'"]'),
                    wireElem = this.editor.select('.group-wire[data-from="'+group.path()+'"][data-to="'+node.path()+'"]'),
                    coords = computeWirePathMiddle(grpElem, nodeElem);

                if (wireElem) {
                    wireElem
                        .select('.bg')
                        .attr({
                            d: 'M'+coords.from.x+','+coords.from.y+' '+coords.to.x+','+coords.to.y
                        });

                    wireElem
                        .select('circle')
                        .attr({
                            cx: coords.to.x,
                            cy: coords.to.y
                        });
                } else {
                    var wireBg = this.editor
                        .path('M'+coords.from.x+','+coords.from.y+' '+coords.to.x+','+coords.to.y)
                        .attr({
                            fill: 'none',
                            stroke: '#5aa564',
                            strokeWidth: 5,
                            strokeLineCap: 'round',
                            strokeLineJoin: 'round',
                            opacity: 0.7,
                            'class': 'bg'
                        })
                        .mouseover(function () {
                            this.attr({ opacity: 0.85, strokeWidth: 6 });
                        })
                        .mouseout(function () {
                            this.attr({ opacity: 0.7, strokeWidth: 5 });
                        });

                    var nodePlug = this.editor
                        .circle(coords.to.x, coords.to.y, 4)
                        .attr({ fill: 'white' });

                    this.editor
                        .group()
                        .attr({
                            'class': 'group-wire',
                            'data-from': group.path(),
                            'data-to': node.path()
                        })
                        .append(wireBg)
                        .append(nodePlug)
                        .mousedown(mouseDownHandler);
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

                var hasMoved = false;

                var node = this.editor
                    .group()
                    .attr({ 'class': 'instance node', 'data-path': instance.path() })
                    .append(bg)
                    .append(nameText)
                    .append(tdefText)
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable(instance)
                    .dragMove(function () {
                        if (!hasMoved) {
                            if (instance.host) {
                                var hostName = instance.host.name;
                                instance.host.removeHosts(instance);

                                // redraw sibling nodes wire when dragging because host node will be redrawn
                                var siblings = factory.model.nodes.array.filter(function (node) {
                                    return node.host && node.host.name === hostName;
                                });
                                siblings.forEach(function redrawWire(sibling) {
                                    sibling.groups.array.forEach(function (group) {
                                        factory.createGroupWire(group, sibling);
                                    });
                                    sibling.hosts.array.forEach(redrawWire);
                                });
                            }

                            // remove all child nodes wires when dragging
                            instance.hosts.array.forEach(function removeWire(childNode) {
                                factory.editor.selectAll('.group-wire[data-to="'+childNode.path()+'"]').remove();
                                childNode.hosts.array.forEach(removeWire);
                            });
                        }
                        hasMoved = true;
                    })
                    .afterDragMove(function () {
                        instance.groups.array.forEach(function (group) {
                            var wire = factory.editor.select('.group-wire[data-from="'+group.path()+'"][data-to="'+instance.path()+'"]');
                            if (wire) {
                                var groupPos = this.data(group.path());
                                if (!groupPos) {
                                    var groupMatrix = factory.editor.select('.group[data-path="'+group.path()+'"]').transform().localMatrix;
                                    groupPos = { x: groupMatrix.e, y: groupMatrix.f + (GROUP_RADIUS/2) + GROUP_PLUG_RADIUS };
                                    this.data(group.path(), groupPos);
                                }

                                var localM = node.transform().localMatrix;
                                var coords = computeWirePathMiddlePts(groupPos, {x: localM.e, y: localM.f}, computedWidth, getNodeUIHeight(instance));

                                wire.select('.bg')
                                    .attr({
                                        d: 'M'+coords.from.x+','+coords.from.y+' '+coords.to.x+','+coords.to.y
                                    });

                                wire.select('circle')
                                    .attr({
                                        cx: coords.to.x,
                                        cy: coords.to.y
                                    });
                            }
                        }.bind(this));
                    })
                    .dragEnd(function (evt) {
                        if (hasMoved) {
                            var intersectedNodes = factory.editor
                                .selectAll('.node').items
                                .filter(function (node) {
                                    // get rid of the chicken/egg problem && be sure the click is in a node
                                    return (node.attr('data-path') !== instance.path()) &&
                                        isPointInsideElem(node, evt.offsetX, evt.offsetY);
                                })
                                .sort(function (a, b) {
                                    // sort by width, smallest first
                                    return a.getBBox().width - b.getBBox().width;
                                });
                            if (intersectedNodes.length > 0) {
                                // put it in the hovered node
                                node.remove();
                                factory.model.findByPath(intersectedNodes[0].attr('data-path')).addHosts(instance);

                                // recursively recreate children UIs
                                instance.components.array.forEach(function (comp) {
                                    factory.createComponent(comp);
                                });
                                instance.hosts.array
                                    .sort(function (a, b) {
                                        // TODO optimize this to loop only once to create node tree heights
                                        return kModelHelper.getNodeTreeHeight(b) - kModelHelper.getNodeTreeHeight(a);
                                    })
                                    .forEach(function updateChildNode(childNode) {
                                        factory.createNode(childNode);
                                        childNode.components.array.forEach(function (instance) {
                                            factory.createComponent(instance);
                                        });
                                        childNode.hosts.array.forEach(updateChildNode);
                                    });
                            }

                            hasMoved = false;
                        }

                        instance.groups.array.forEach(function (group) {
                            this.removeData(group.path());
                            factory.createGroupWire(group, instance);
                        }.bind(this));

                        instance.hosts.array.forEach(function addWire(childNode) {
                            childNode.groups.array.forEach(function (group) {
                                factory.createGroupWire(group, childNode);
                            });
                            childNode.hosts.array.forEach(addWire);
                        });
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

                try {
                    refreshNode(getHighestNodePath(node));
                } catch (err) {}

                instance.groups.array.forEach(function (group) {
                    factory.createGroupWire(group, instance);
                });

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

                var hasMoved = false,
                    parentNode = instance.eContainer();

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
                    comp.append(this.editor
                        .group()
                        .attr({
                            'class': 'port provided',
                            'data-name': portType.name
                        })
                        .transform('t'+PORT_X_PADDING+','+providedDy)
                        .append(this.editor
                            .circle(0, (COMP_HEIGHT/2) - 5, 11)
                            .attr({
                                fill: '#bc7645',
                                stroke: '#ECCA40',
                                strokeWidth: 2
                            }))
                        .append(this.editor
                            .text(0, COMP_HEIGHT - 4, portType.name.substr(0, (portType.name.length > 5) ? 5:portType.name.length))
                            .attr({
                                fill: 'white',
                                textAnchor: 'middle',
                                title: portType.name
                            })));

                    providedDy += COMP_HEIGHT;
                }.bind(this));

                instance.typeDefinition.required.array.forEach(function (portType) {
                    comp.append(this.editor
                        .group()
                        .attr({
                            'class': 'port required',
                            'data-name': portType.name
                        })
                        .transform('t'+(computedWidth - PORT_X_PADDING)+','+requiredDy)
                        .append(this.editor
                            .circle(0, (COMP_HEIGHT/2) - 5, 11)
                            .attr({
                                fill: '#bc7645',
                                stroke: '#C60808',
                                strokeWidth: 2
                            }))
                        .append(this.editor
                            .text(0, COMP_HEIGHT - 4, portType.name.substr(0, (portType.name.length > 5) ? 5:portType.name.length))
                            .attr({
                                fill: 'white',
                                textAnchor: 'middle',
                                title: portType.name
                            })));

                    requiredDy += COMP_HEIGHT;
                }.bind(this));

                comp.mousedown(mouseDownHandler)
                    .touchable()
                    .draggable()
                    .dragMove(function () {
                        if (!hasMoved) {
                            parentNode.removeComponents(instance);
                        }
                        hasMoved = true;
                    })
                    .dragEnd(function (evt) {
                        if (hasMoved) {
                            var hoveredNode = getHoveredNode(evt.offsetX, evt.offsetY);
                            if (hoveredNode) {
                                comp.remove();
                                factory.model.findByPath(hoveredNode.attr('data-path')).addComponents(instance);
                            } else {
                                // if dropped in "nothing" then put it back into its old host node
                                comp.remove();
                                parentNode.addComponents(instance);
                            }
                            parentNode = null;
                            hasMoved = false;
                        }
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

                try {
                    refreshNode(getHighestNodePath(comp));
                } catch (err) {}
                return comp;
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
                    .mousedown(mouseDownHandler)
                    .touchable()
                    .draggable(instance)
                    .relocate(instance);
            },

            deleteInstance: function (parent, path) {
                var elem = this.editor.select('.instance[data-path="'+path+'"]');
                if (elem) {
                    if (elem.hasClass('comp') || elem.hasClass('node')) {
                        var highestNodePath = getHighestNodePath(elem);
                        if (factory.draggedInstancePath === path) {
                            var absBbox = getAbsoluteBBox(elem);

                            // append it to the editor
                            this.editor.append(elem);

                            elem.data('ot', 't'+absBbox.x+','+absBbox.y);
                        } else {
                            this.editor.selectAll('.group-wire[data-to="'+path+'"]').remove();
                            elem.remove();
                        }

                        refreshNode(highestNodePath);
                    } else {
                        elem.remove();
                    }
                }
                invokeListener();
            },

            deleteGroupWire: function (groupPath, nodePath) {
                var elem = this.editor.select('.group-wire[data-from="'+groupPath+'"][data-to="'+nodePath+'"]');
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
                invokeListener();
            },

            deleteGroups: function () {
                this.editor.selectAll('.group').remove();
                invokeListener();
            },

            deleteChannels: function () {
                this.editor.selectAll('.chan').remove();
                invokeListener();
            },

            deleteBindings: function () {
                this.editor.selectAll('.binding').remove();
                invokeListener();
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
                                //refreshComp(comp.path().replace(previousPath, instance.path()));
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
                }
            },

            getSelected: function () {
                var selected = this.editor
                    .selectAll('.selected').items
                    .map(function (elem) {
                        // all selected element are in groups so we need to return the parent
                        return elem.parent();
                    });

                var children = [];
                selected.forEach(function (elem) {
                    children = children.concat(elem.selectAll('.instance').items);
                });

                return selected.concat(children);
            },

            getNodePathAtPoint: function (x, y) {
                var container = this.getEditorContainer();
                var node = getHoveredNode(x-container.offsetLeft, y-container.offsetTop);
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

            setModel: function (model) {
                this.model = model;
                if (this.editor) {
                    updateSVGDefs(model);

                    this.editor.clear();
                    invokeListener();
                }
            }
        };

        /**
         *
         */
        Snap.plugin(function (Snap, Element) {
            var dragStart = function (dx) {
                var args = arguments;
                factory.draggedInstancePath = this.attr('data-path');

                var handlers = this.data('dragStart');
                if (handlers) {
                    handlers.forEach(function (handler) {
                        handler.apply(this, args);
                    }.bind(this));
                }

                if((typeof dx === 'object') && ( dx.type === 'touchstart')) {
                    mouseDownHandler.call(this, dx); // select instance on touch event
                    dx.preventDefault();
                    this.data('ox', dx.changedTouches[0].clientX);
                    this.data('oy', dx.changedTouches[0].clientY);
                }
                this.data('ot', this.transform().local );
            };

            var dragMove = function (dx, dy /*, x, y, evt*/) {
                var args = arguments;
                var handlers = this.data('dragMove');
                if (handlers) {
                    handlers.forEach(function (handler) {
                        handler.apply(this, args);
                    }.bind(this));
                }

                if((typeof dx === 'object') && ( dx.type === 'touchmove')) {
                    dy = dx.changedTouches[0].clientY - this.data('oy');
                    dx = dx.changedTouches[0].clientX - this.data('ox');
                }

                this.transform(this.data('ot') + (this.data('ot') ? 'T':'t') + [ dx, dy ]);

                // TODO this needs improvment because Firefox suck at it (Chrome is fine though)
                //if (factory.draggedInstancePath) {
                //    factory.editor.selectAll('.node .bg').attr({ stroke: 'white' });
                //    var node = getHoveredNode(evt.offsetX, evt.offsetY);
                //    if (node) {
                //        node.select('.bg').attr({ stroke: 'yellow' });
                //    }
                //}
                handlers = this.data('afterDragMove');
                if (handlers) {
                    handlers.forEach(function (handler) {
                        handler.apply(this, args);
                    }.bind(this));
                }
            };

            var dragEnd = function () {
                var args = arguments;
                var handlers = this.data('dragEnd');
                if (handlers) {
                    handlers.forEach(function (handler) {
                        handler.apply(this, args);
                    }.bind(this));
                }

                factory.draggedInstancePath = null;
            };

            Element.prototype.draggable = function (instance) {
                this.drag(dragMove, dragStart, function () {
                    if (instance) {
                        var pos = instance.findMetaDataByID(KWE_POSITION);
                        if (!pos) {
                            pos = kFactory.createValue();
                            pos.name = KWE_POSITION;
                            instance.addMetaData(pos);
                        }
                        var matrix = this.transform().localMatrix;
                        pos.value = JSON.stringify({ x: matrix.e, y: matrix.f });
                    }
                    dragEnd.apply(this, arguments);
                });
                return this;
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

            Element.prototype.afterDragMove = function (handler) {
                var handlers = this.data('afterDragMove') || [];
                handlers.push(handler);
                return this.data('afterDragMove', handlers);
            };

            Element.prototype.touchable = function () {
                return this
                    .touchstart(dragStart)
                    .touchend(dragEnd)
                    .touchmove(dragMove);
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
                this.transform('t'+pos.x+','+pos.y);
                return this;
            };
        });

        /**
         *
         * @param evt
         */
        var mouseDownHandler = function (evt) {
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
            evt.cancelBubble = true;
            if (factory.listener) {
                factory.listener(this.attr('data-path'));
            }
        };

        /**
         *
         * @param selected
         */
        var invokeListener = function (selected) {
            if (factory.listener) {
                if (selected) {
                    factory.listener(selected);
                } else {
                    selected = factory.editor.select('.selected');
                    if (selected) {
                        factory.listener(selected.parent().attr('data-path'));
                    } else {
                        factory.listener(null);
                    }
                }
            }
        };

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
         *
         * @param path
         */
        function refreshNode(path) {
            var instance = factory.model.findByPath(path);
            if (instance) {
                var node = factory.editor.select('.node[data-path="'+path+'"]');
                var treeHeight = kModelHelper.getNodeTreeHeight(instance);
                var computedWidth = NODE_WIDTH+(20*treeHeight);
                if (instance.host) {
                    computedWidth = NODE_WIDTH+(20*(kModelHelper.getNodeTreeHeight(instance.host)-1));
                }

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

                //instance.groups.array.forEach(function (group) {
                //    factory.createGroupWire(group, instance);
                //});

                instance.components.array.forEach(function (comp) {
                    refreshComp(comp.path());
                });

                instance.hosts.array.forEach(function (host) {
                    refreshNode(host.path());
                });

                // apply dx,dy transformation of level-1 children
                var children = factory.editor.selectAll('.node[data-path="'+instance.path()+'"] > .instance').items;
                var dy = NODE_HEIGHT;
                children.forEach(function (child) {
                    child.transform('t'+((computedWidth - child.select('.bg').asPX('width'))/2)+','+dy);
                    dy += child.select('.bg').asPX('height') + 10;
                });
            }
        }

        /**
         *
         * @param path
         */
        function refreshComp(path) {
            var instance = factory.model.findByPath(path);
            if (instance) {
                var comp = factory.editor.select('.comp[data-path="'+path+'"]');
                var host = factory.editor.select('.node[data-path="'+instance.eContainer().path()+'"]');
                var treeHeight = kModelHelper.getNodeTreeHeight(instance.eContainer());
                var computedWidth = host.select('.bg').asPX('width') - 20;

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
                if (elem.parent().hasClass('instance')) {
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

        /**
         *
         * @param x
         * @param y
         * @returns {*|T}
         */
        function getHoveredNode(x, y) {
            return factory.editor
                .selectAll('.node').items
                .filter(function (node) {
                    return isPointInsideElem(node, x, y);
                })
                .sort(function (a, b) {
                    return a.getBBox().width - b.getBBox().width;
                })[0];
        }

        /**
         *
         * @param fromElem
         * @param toElem
         * @returns {{from: {x: number, y: number}, middle: {x: number, y: number}, to: {x: number, y: number}}}
         */
        function computeWirePathMiddle(fromElem, toElem) {
            var fromM = fromElem.transform().localMatrix,
                toM = getAbsoluteBBox(toElem),
                from = { x: fromM.e, y: fromM.f + (GROUP_RADIUS/2) + GROUP_PLUG_RADIUS },
                width = toElem.select('.bg').asPX('width'),
                height = toElem.select('.bg').asPX('height');

            return computeWirePathMiddlePts(from, toM, width, height);
        }

        /**
         *
         * @param from
         * @param to
         * @param width
         * @param height
         * @returns {{from: {x: number, y: number}, middle: {x: number, y: number}, to: {x: number, y: number}}}
         */
        function computeWirePathMiddlePts(from, to, width, height) {
            var middle = { x: 0, y: 0 };

            if (from.x >= to.x + width/3 && from.x <= to.x + (width/3)*2) {
                // connect at middle
                to.x += width/2;

            } else if (from.x > to.x + (width/3)*2) {
                // connect at right
                to.x += width - 2;

            } else {
                // connect at left
                to.x += 2;
            }

            if (from.y >= to.y + height/3 && from.y <= to.y + (height/3)*2) {
                // connect at middle
                to.y += height/2;
                to.x -= 2;

            } else  if (from.y > to.y + (height/3)*2) {
                // connect at bottom
                to.y += height - 2;

            } else {
                // connect at top
                to.y += 2;
            }

            if (from.x > to.x) {
                middle.x = to.x + (from.x - to.x)/2;
            } else {
                middle.x = from.x + (to.x - from.x)/2;
            }

            middle.y = ((from.y >= to.y) ? from.y : to.y) + 20;

            return {
                from: from,
                middle: middle,
                to: to
            };
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