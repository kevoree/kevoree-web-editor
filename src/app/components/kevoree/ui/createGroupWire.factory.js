'use strict';

angular.module('editorApp')
  .factory('uiCreateGroupWire', function (uiUtils, util, GROUP_RADIUS) {
    return function (ui, group, node) {
      var grpElem, nodeElem, wireElem, wireBg, pt, data = {};

      function computeData() {
        grpElem = ui.editor.select('.group[data-path="' + group.path() + '"]');
        nodeElem = ui.editor.select('.node[data-path="' + node.path() + '"]');
        wireElem = ui.editor.select('.group-wire[data-from="' + group.path() + '"][data-to="' + node.path() + '"]');

        var grpMatrix = grpElem.transform().localMatrix,
          toBox = uiUtils.getAbsoluteBBox(nodeElem);

        data = {
          from: {
            x: 0,
            y: 0
          },
          to: {
            x: toBox.x - grpMatrix.e,
            y: toBox.y - grpMatrix.f
          },
          width: nodeElem.select('.bg').asPX('width'),
          height: nodeElem.select('.bg').asPX('height')
        };
      }
      computeData();
      var toAnchor = uiUtils.computeWireNodeAnchor(data.from, data.to, data.width, data.height);
      if (wireElem) {
        // update data
        wireElem
          .data('data', data);
        // update bg location
        wireBg = wireElem
          .select('path')
          .attr({
            d: 'M' + data.from.x + ',' + data.from.y + ' ' + toAnchor.x + ',' + toAnchor.y
          });
        pt = wireBg.getPointAtLength(GROUP_RADIUS + 2);
        wireBg.attr({ d: 'M' + pt.x + ',' + pt.y + ' ' + toAnchor.x + ',' + toAnchor.y });
        // update node plug location
        wireElem
          .select('circle')
          .attr({
            cx: toAnchor.x,
            cy: toAnchor.y
          });
      } else {
        wireBg = ui.editor
          .path('M' + data.from.x + ',' + data.from.y + ' ' + toAnchor.x + ',' + toAnchor.y)
          .attr({
            fill: 'none',
            stroke: '#5aa564',
            strokeWidth: 4,
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            'class': 'bg'
          })
          .mouseover(function () {
            this.attr({
              strokeWidth: 5
            });
          })
          .mouseout(function () {
            this.attr({
              strokeWidth: 4
            });
          });

        var nodePlug = ui.editor
          .circle(toAnchor.x, toAnchor.y, 4)
          .attr({
            fill: 'white'
          });

        grpElem
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
            var newTo = {
              x: data.to.x - dx,
              y: data.to.y - dy
            };
            var anchor = uiUtils.computeWireNodeAnchor(data.from, newTo, data.width, data.height);
            wireBg.attr({
              d: 'M' + data.from.x + ',' + data.from.y + ' ' + anchor.x + ',' + anchor.y
            });
            pt = wireBg.getPointAtLength(GROUP_RADIUS + 2);
            wireBg.attr({ d: 'M' + pt.x + ',' + pt.y + ' ' + anchor.x + ',' + anchor.y });
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
            var anchor = uiUtils.computeWireNodeAnchor(data.from, nTo, data.width, data.height);
            wireBg.attr({
              d: 'M' + data.from.x + ',' + data.from.y + ' ' + anchor.x + ',' + anchor.y
            });
            pt = wireBg.getPointAtLength(GROUP_RADIUS + 2);
            wireBg.attr({ d: 'M' + pt.x + ',' + pt.y + ' ' + anchor.x + ',' + anchor.y });
            nodePlug.attr({
              cx: anchor.x,
              cy: anchor.y
            });
          })
          .dragEnd(function () {
            computeData();
            this.data('data', data);
          });

        pt = wireBg.getPointAtLength(GROUP_RADIUS + 2);
        wireBg.attr({ d: 'M' + pt.x + ',' + pt.y + ' ' + toAnchor.x + ',' + toAnchor.y });
      }
    };
  });
