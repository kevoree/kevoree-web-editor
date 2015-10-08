'use strict';

angular.module('editorApp')
    .factory('uiUtils', function (kModelHelper, NODE_HEIGHT, NODE_WIDTH, COMP_HEIGHT, CHANNEL_RADIUS, GROUP_RADIUS) {
        /**
         *
         * @param node
         * @returns {number}
         */
        function getNodeUIHeight(node) {
            var height = NODE_HEIGHT; // minimum node height

            node.components.array.forEach(function(comp) {
                height += getCompUIHeight(comp) + 10;
            });

            node.hosts.array.forEach(function(child) {
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
            return x >= bbox.x &&
                x <= bbox.x + bbox.width &&
                y >= bbox.y &&
                y <= bbox.y + bbox.height;
        }

        function computeWireNodeAnchor(from, to, width, height) {
            function getHorizontalAlignment() {
                if (from.x >= to.x + width / 3 && from.x <= to.x + (width / 3) * 2) {
                    return 'middle';


                } else if (from.x > to.x + (width / 3) * 2) {
                    return 'right';

                } else {
                    return 'left';
                }
            }

            function getVerticalAlignment() {
                if (from.y >= to.y + height / 3 && from.y <= to.y + (height / 3) * 2) {
                    return 'middle';

                } else if (from.y > to.y + (height / 3) * 2) {
                    return 'bottom';

                } else {
                    return 'top';
                }
            }

            var alignment = getVerticalAlignment() + '-' + getHorizontalAlignment();
            switch (alignment) {
                default:
                    case 'top-left':
                    return {
                    x: to.x + 2,
                    y: to.y + 2
                };

                case 'top-middle':
                        return {
                        x: to.x + width / 2,
                        y: to.y
                    };

                case 'top-right':
                        return {
                        x: to.x + width - 2,
                        y: to.y + 2
                    };

                case 'middle-left':
                        return {
                        x: to.x,
                        y: to.y + height / 2
                    };

                case 'middle-right':
                        return {
                        x: to.x + width,
                        y: to.y + height / 2
                    };

                case 'bottom-left':
                        return {
                        x: to.x + 2,
                        y: to.y + height - 2
                    };

                case 'bottom-middle':
                        return {
                        x: to.x + width / 2,
                        y: to.y + height
                    };

                case 'bottom-right':
                        return {
                        x: to.x + width - 2,
                        y: to.y + height - 2
                    };
            }
        }

        function computeBindingCoords(portElem, chanElem) {
            var chanM = chanElem.transform().localMatrix,
                chan = {
                    x: chanM.e,
                    y: chanM.f + (CHANNEL_RADIUS / 2)
                },
                compBox = getAbsoluteBBox(portElem.parent()),
                portM = portElem.transform().localMatrix,
                port = {
                    x: compBox.x + portM.e,
                    y: compBox.y + portM.f + 15
                },
                middle = {
                    x: 0,
                    y: 0
                };

            if (port.x > chan.x) {
                middle.x = chan.x + (port.x - chan.x) / 2;
            } else {
                middle.x = port.x + (chan.x - port.x) / 2;
            }

            middle.y = ((port.y >= chan.y) ? port.y : chan.y) + 20;

            return {
                chan: chan,
                port: port,
                middle: middle
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
                    grpCircle.setAttribute('cx', 0 + '');
                    grpCircle.setAttribute('cy', 0 + '');
                    grpCircle.setAttribute('r', (GROUP_RADIUS - 4) + '');
                    clipPath.appendChild(grpCircle);
                    defs.appendChild(clipPath);
                }

                if (!document.getElementById('chan-clip')) {
                    clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.id = 'chan-clip';
                    var chanCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    chanCircle.setAttribute('cx', 0 + '');
                    chanCircle.setAttribute('cy', 0 + '');
                    chanCircle.setAttribute('r', (CHANNEL_RADIUS - 4) + '');
                    clipPath.appendChild(chanCircle);
                    defs.appendChild(clipPath);
                }

                var nodeTreeHeights = kModelHelper.getNodeTreeHeights(model.nodes.array);
                nodeTreeHeights.forEach(function(height) {
                    if (!document.getElementById('node-clip-' + height)) {
                        var nodeClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                        nodeClip.id = 'node-clip-' + height;
                        var nodeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        nodeRect.setAttribute('width', (NODE_WIDTH + (20 * height) - 5) + '');
                        nodeRect.setAttribute('height', '100%');
                        nodeRect.setAttribute('x', 2 + '');
                        nodeRect.setAttribute('y', 0 + '');
                        nodeClip.appendChild(nodeRect);
                        defs.appendChild(nodeClip);
                    }

                    if (!document.getElementById('comp-clip-' + height)) {
                        var compClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                        compClip.id = 'comp-clip-' + height;
                        var compRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        compRect.setAttribute('width', (NODE_WIDTH + (20 * height) - 112) + '');
                        compRect.setAttribute('height', '100%');
                        compRect.setAttribute('x', 46 + '');
                        compRect.setAttribute('y', 0 + '');
                        compClip.appendChild(compRect);
                        defs.appendChild(compClip);
                    }
                });
            }
        }

        return {
            getAbsoluteBBox: getAbsoluteBBox,
            getNodeUIHeight: getNodeUIHeight,
            getCompUIHeight: getCompUIHeight,
            getHighestNodePath: getHighestNodePath,
            isPointInsideElem: isPointInsideElem,
            computeWireNodeAnchor: computeWireNodeAnchor,
            computeBindingCoords: computeBindingCoords,
            updateSVGDefs: updateSVGDefs
        };
    });
