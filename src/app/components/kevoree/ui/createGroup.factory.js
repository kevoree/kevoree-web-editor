'use strict';

angular.module('editorApp')
  .factory('uiCreateGroup', function (kModelHelper, uiUtils, util, GROUP_RADIUS, GROUP_PLUG_RADIUS) {
    return function (ui, instance) {
      ui.removeUIElem(instance.path());
      uiUtils.updateSVGDefs(ui.model);

      var bg = ui.editor
        .circle(0, 0, GROUP_RADIUS)
        .attr({
          fill: 'green',
          stroke: '#000',
          strokeWidth: 3,
          'class': kModelHelper.isSelected(instance) ? 'bg selected' : 'bg',
          opacity: 0.75
        });

      var plug = ui.editor
        .circle(0, (GROUP_RADIUS / 2) + GROUP_PLUG_RADIUS, GROUP_PLUG_RADIUS)
        .attr({
          fill: '#f1c30f',
          'class': 'group-plug'
        })
        .mouseover(function () {
          this.attr({
            r: GROUP_PLUG_RADIUS + 1
          });
        })
        .mouseout(function () {
          this.attr({
            r: GROUP_PLUG_RADIUS
          });
        })
        .drag(
          function (dx, dy, cx, cy) {
            var plugPos = this.data('plugPos');
            this.data('wire').attr({
              d: 'M' + plugPos.x + ',' + plugPos.y + ' ' + (plugPos.x + dx) + ',' + (plugPos.y + dy)
            });

            clearTimeout(this.data('wireTimeout'));
            var nodeElem = this.data('hoveredNode');
            if (nodeElem) {
              nodeElem.select('.bg').removeClass('hovered error');
            }

            var timeout = setTimeout(function () {
              var pt = uiUtils.getPointInEditor(cx, cy);
              var nodeElem = ui.getHoveredNode(pt.x, pt.y);
              if (nodeElem) {
                this.data('hoveredNode', nodeElem);
                var nodeBg = nodeElem.select('.bg');
                nodeBg.addClass('hovered');

                var node = ui.model.findByPath(nodeElem.attr('data-path'));
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
            var grpM = group.transform().localMatrix; // eslint-disable-line
            var plugPos = {
              x: grpM.e,
              y: grpM.f + (GROUP_RADIUS / 2) + GROUP_PLUG_RADIUS
            };
            this.data('plugPos', plugPos);
            var wire = ui.editor
              .path('M' + plugPos.x + ',' + plugPos.y + ' ' + plugPos.x + ',' + plugPos.y)
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
                var nodeInstance = ui.model.findByPath(nodeElem.attr('data-path'));
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

      var nameText = ui.editor
        .text(0, -5, instance.name)
        .attr({
          fill: util.isTruish(instance.started) ? '#fff' : '#000',
          textAnchor: 'middle',
          'class': 'name',
          'clip-path': 'url(#group-clip)'
        });

      var tdefText = ui.editor
        .text(0, 10, instance.typeDefinition.name)
        .attr({
          fill: 'white',
          textAnchor: 'middle',
          'clip-path': 'url(#group-clip)'
        });

      var group = ui.editor
        .group()
        .attr({
          'class': 'instance group',
          'data-path': instance.path()
        })
        .append(bg)
        .append(nameText)
        .append(tdefText)
        .append(plug)
        .selectable(instance)
        .draggable()
        .dragMove(function () {
          var args = arguments;
          instance.subNodes.array.forEach(function (subNode) {
            var wire = ui.editor.select('.group-wire[data-from="' + instance.path() + '"][data-to="' + subNode.path() + '"]');
            if (wire) {
              wire.data('startPtDrag').apply(wire, args);
            }
          });
        })
        .dragEnd(function () {
          var args = arguments;
          instance.subNodes.array.forEach(function (subNode) {
            var wire = ui.editor.select('.group-wire[data-from="' + instance.path() + '"][data-to="' + subNode.path() + '"]');
            if (wire) {
              wire.data('dragEnd').forEach(function (handler) {
                handler.apply(wire, args);
              });
            }
          });
        })
        .relocate(instance);

      ui.updateValidity(instance);

      plug.touchstart(function (evt) {
        evt.cancelBubble = true;
      });
      plug.mousedown(function (evt) {
        evt.cancelBubble = true;
      });

      return group;
    };
  });
