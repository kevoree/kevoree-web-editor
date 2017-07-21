'use strict';

angular.module('editorApp')
  .factory('uiCreateChannel', function (kModelHelper, uiUtils, util, CHANNEL_RADIUS) {
    return function (ui, instance) {
      ui.removeUIElem(instance.path());
      uiUtils.updateSVGDefs(ui.model);

      var bg = ui.editor
        .circle(0, 0, CHANNEL_RADIUS)
        .attr({
          fill: '#DB661D',
          stroke: util.isTruish(instance.started) ? '#fff' : '#000',
          strokeWidth: 2,
          class: kModelHelper.isSelected(instance) ? 'bg selected' : 'bg',
          opacity: 0.75,
          title: instance.name + ': ' + instance.typeDefinition.name
        });

      // var nameText = ui.editor
      //     .text(0, -5, instance.name)
      //     .attr({
      //         fill: util.isTruish(instance.started) ? '#fff' : '#000',
      //         textAnchor: 'middle',
      //         'class': 'name',
      //         'clip-path': 'url(#chan-clip)'
      //     });
      //
      // var tdefText = ui.editor
      //     .text(0, 10, instance.typeDefinition.name)
      //     .attr({
      //         fill: 'white',
      //         textAnchor: 'middle',
      //         'clip-path': 'url(#chan-clip)'
      //     });

      var channel = ui.editor
        .group()
        .attr({
          'class': 'instance chan',
          'data-path': instance.path()
        })
        .append(bg)
        // .append(nameText)
        // .append(tdefText)
        .selectable(instance)
        .draggable()
        .dragMove(function () {
          var args = arguments;
          instance.bindings.array.forEach(function (binding) {
            //factory.createBinding(binding);
            var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
            elem.data('startPtDrag').apply(elem, args);
          });
        })
        .dragEnd(function () {
          var args = arguments;

          // update bindings coords when done
          instance.bindings.array.forEach(function (binding) {
            var elem = ui.editor.select('.binding[data-path="' + binding.path() + '"]');
            if (elem) {
              elem.data('dragEnd').forEach(function (handler) {
                handler.apply(elem, args);
              });
            }
          });
        })
        .relocate(instance);

      bg
        .mousemove(function (e, cx, cy) {
          clearTimeout(this.data('showName'));
          var timeout = setTimeout(function () {
            var pt = uiUtils.getPointInEditor(cx, cy + 5),
              textAnchor, x;
            var width = ui.editor.getBBox().width;
            if (pt.x > (width / 2)) {
              x = -(CHANNEL_RADIUS * 2);
              textAnchor = 'end';
            } else {
              x = CHANNEL_RADIUS * 2;
              textAnchor = 'start';
            }
            var elem = channel.select('.name');
            if (elem) {
              elem.attr({ x: x, textAnchor: textAnchor });
            } else {
              channel.append(ui.editor
                .text(x, 0, instance.name + ': ' + instance.typeDefinition.name)
                .attr({
                  fill: util.isTruish(instance.started) ? '#fff' : '#000',
                  textAnchor: textAnchor,
                  'class': 'name'
                }));
            }
          }, 300);
          this.data('showName', timeout);
        })
        .mouseout(function () {
          clearTimeout(this.data('showName'));
          var elem = channel.select('.name');
          if (elem) {
            elem.remove();
          }
        });

      ui.updateValidity(instance);
    };
  });
