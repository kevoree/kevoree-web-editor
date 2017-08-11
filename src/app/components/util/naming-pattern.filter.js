'use strict';

angular.module('editorApp')
  .filter('namingPattern', function (util) {
    var rInt = new RegExp('\\{randomInt(:(\\d+):(\\d+))?\\}', 'g'),
      rStr = new RegExp('\\{randomStr(:(\\d+))?\\}', 'g');

    return function (text, map) {
      if (typeof text === 'string') {
        if (typeof map === 'object') {
          Object.keys(map).forEach(function (key) {
            text = text.replace(new RegExp('{' + key + '}', 'g'), map[key]);
          });
        }

        var rIntMatch = rInt.exec(text);
        var rIntVal = util.randomNumber();
        if (rIntMatch && rIntMatch[2] && rIntMatch[3]) {
          rIntVal = util.randomNumber(parseInt(rIntMatch[2], 10), parseInt(rIntMatch[3], 10));
        }
        var rStrMatch = rStr.exec(text);
        var rStrVal = util.randomString();
        if (rStrMatch && rStrMatch[2]) {
          rStrVal = util.randomString(parseInt(rStrMatch[2], 10));
        }
        return text.replace(rInt, rIntVal)
          .replace(rStr, rStrVal);
      } else {
        throw new Error('namingPattern filter must be applied on string only.');
      }
    };
  });
