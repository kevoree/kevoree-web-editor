'use strict';

angular.module('editorApp')
	.service('storage', function () {
  return {
    get: function (key, defaultVal) {
      var val = localStorage.getItem(key);
      if (val) {
        return JSON.parse(val).val;
      } else {
        return defaultVal;
      }
    },
    set: function (key, val) {
      localStorage.setItem(key, JSON.stringify({
        val: val
      }));
    },
    remove: function (key) {
      localStorage.removeItem(key);
    },
    clear: function () {
      localStorage.clear();
    },
    keys: function () {
      var keys = [];
      for (var i = 0, len = localStorage.length; i < len; ++i) {
        keys.push(localStorage.key(i));
      }
      return keys;
    }
  };
});
