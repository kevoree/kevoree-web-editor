'use strict';

angular.module('editorApp')
    .factory('uiCreateChannel', function (uiUtils, util, CHANNEL_RADIUS) {
        return function(ui, instance) {
            ui.removeUIElem(instance.path());
            uiUtils.updateSVGDefs(ui.model);

            var bg = ui.editor
                .circle(0, 0, CHANNEL_RADIUS)
                .attr({
                    fill: '#d57129',
                    stroke: '#fff',
                    strokeWidth: 3,
                    'class': 'bg',
                    opacity: 0.75
                });

            var nameText = ui.editor
                .text(0, -5, instance.name)
                .attr({
                    fill: util.isTruish(instance.started) ? '#fff' : '#000',
                    textAnchor: 'middle',
                    'class': 'name',
                    'clip-path': 'url(#chan-clip)'
                });

            var tdefText = ui.editor
                .text(0, 10, instance.typeDefinition.name)
                .attr({
                    fill: 'white',
                    textAnchor: 'middle',
                    'clip-path': 'url(#chan-clip)'
                });

            ui.editor
                .group()
                .attr({
                    'class': 'instance chan',
                    'data-path': instance.path()
                })
                .append(bg)
                .append(nameText)
                .append(tdefText)
                .selectable()
                .draggable()
                .dragMove(function() {
                    var args = arguments;
                    instance.bindings.array.forEach(function(binding) {
                        //factory.createBinding(binding);
                        var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
                        elem.data('endPtDrag').apply(elem, args);
                    });
                })
                .dragEnd(function() {
                    var args = arguments;

                    // update bindings coords when done
                    instance.bindings.array.forEach(function(binding) {
                        var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
                        if (elem) {
                            elem.data('dragEnd').forEach(function(handler) {
                                handler.apply(elem, args);
                            });
                        }
                    });
                })
                .relocate(instance);

            ui.updateValidity(instance);
        };
    });
