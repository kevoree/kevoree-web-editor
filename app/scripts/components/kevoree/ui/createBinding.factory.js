'use strict';

angular.module('editorApp')
    .factory('uiCreateBinding', function (uiUtils, CHANNEL_RADIUS) {
        return function(ui, binding) {
            if (binding.hub && binding.port) {
                var portElem = ui.editor.select('.comp[data-path="' + binding.port.eContainer().path() + '"] .port[data-name="' + binding.port.name + '"]'),
                    chanElem = ui.editor.select('.chan[data-path="' + binding.hub.path() + '"]'),
                    bindingElem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');

                if (portElem && chanElem) {
                    var coords = uiUtils.computeBindingCoords(portElem, chanElem);
                    if (bindingElem) {
                        bindingElem.data('coords', coords);
                        var path0 = bindingElem
                            .select('.bg')
                            .attr({
                                d: 'M' + coords.chan.x + ',' + coords.chan.y + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + coords.port.x + ',' + coords.port.y
                            });
                        var pt0 = path0.getPointAtLength(CHANNEL_RADIUS + 1);
                        path0.attr({ d: 'M' + pt0.x + ',' + pt0.y + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + coords.port.x + ',' + coords.port.y });
                    } else {
                        var bindingBg = ui.editor
                            .path('M' + coords.chan.x + ',' + coords.chan.y + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + coords.port.x + ',' + coords.port.y)
                            .attr({
                                fill: 'none',
                                stroke: (binding.port.getRefInParent() === 'provided') ? '#ECCA40' : '#C60808',
                                strokeWidth: 5,
                                strokeLineCap: 'round',
                                strokeLineJoin: 'round',
                                opacity: 0.7,
                                'class': 'bg'
                            })
                            .mouseover(function() {
                                this.attr({
                                    opacity: 0.85,
                                    strokeWidth: 6
                                });
                            })
                            .mouseout(function() {
                                this.attr({
                                    opacity: 0.7,
                                    strokeWidth: 5
                                });
                            });

                        var pt1 = bindingBg.getPointAtLength(CHANNEL_RADIUS + 1);
                        bindingBg.attr({ d: 'M' + pt1.x + ',' + pt1.y + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + coords.port.x + ',' + coords.port.y });

                        ui.editor
                            .group()
                            .attr({
                                'class': 'binding',
                                'data-path': binding.path()
                            })
                            .data('coords', coords)
                            .append(bindingBg)
                            .selectable()
                            .firstDragMove(function() {
                                this.appendTo(ui.editor);
                            })
                            .startPtDrag(function(dx, dy) {
                                var coords = this.data('coords');
                                var chanDx = coords.chan.x + dx,
                                    chanDy = coords.chan.y + dy;

                                if (coords.port.x > chanDx) {
                                    coords.middle.x = chanDx + (coords.port.x - chanDx) / 2;
                                } else {
                                    coords.middle.x = coords.port.x + (chanDx - coords.port.x) / 2;
                                }

                                coords.middle.y = ((coords.port.y >= chanDy) ? coords.port.y : chanDy) + 20;

                                bindingBg.attr({
                                    d: 'M' + chanDx + ',' + chanDy + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + coords.port.x + ',' + coords.port.y
                                });
                                var pt = bindingBg.getPointAtLength(CHANNEL_RADIUS + 1);
                                bindingBg.attr({ d: 'M' + pt.x + ',' + pt.y + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + coords.port.x + ',' + coords.port.y });
                            })
                            .endPtDrag(function(dx, dy) {
                                var coords = this.data('coords');
                                var portDx = coords.port.x + dx,
                                    portDy = coords.port.y + dy;

                                if (portDx > coords.chan.x) {
                                    coords.middle.x = coords.chan.x + (portDx - coords.chan.x) / 2;
                                } else {
                                    coords.middle.x = portDx + (coords.chan.x - portDx) / 2;
                                }

                                coords.middle.y = ((portDy >= coords.chan.y) ? portDy : coords.chan.y) + 20;

                                bindingBg.attr({
                                    d: 'M' + coords.chan.x + ',' + coords.chan.y + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + portDx + ',' + portDy
                                });
                                var pt = bindingBg.getPointAtLength(CHANNEL_RADIUS + 1);
                                bindingBg.attr({ d: 'M' + pt.x + ',' + pt.y + ' Q' + coords.middle.x + ',' + coords.middle.y + ' ' + portDx + ',' + portDy });
                            })
                            .dragEnd(function() {
                                var portElem = ui.editor.select(
                                        '.comp[data-path="' + binding.port.eContainer().path() + '"] ' +
                                        '.port[data-name="' + binding.port.name + '"]'),
                                    chanElem = ui.editor.select('.chan[data-path="' + binding.hub.path() + '"]');
                                this.data('coords', uiUtils.computeBindingCoords(portElem, chanElem));
                            });
                    }
                }
            }
        };
    });
