'use strict';

angular.module('editorApp')
	.filter('isCompatible', function (kModelHelper, kEditor) {
		return function (items, type, nodeName) {
			if (type === 'component') {
				return items.filter(function (item) {
					if (item && item.tdef && nodeName) {
						var isCompatible = kModelHelper.isCompatible(item.tdef, kEditor.getModel().findNodesByID(nodeName));
						return isCompatible;
					} else {
						return false;
					}
				});
			} else {
				return items;
			}
		};
	});
