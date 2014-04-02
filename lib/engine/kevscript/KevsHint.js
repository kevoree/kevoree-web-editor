var Class = require('pseudoclass');

/**
 * CodeMirror KevScript add-on hint (autocompletion)
 * Created by leiko on 01/04/14.
 */
var KevsHint = Class({
    toString: 'KevsHint',

    construct: function (model) {
        CodeMirror.registerHelper('hint', 'kevscript', function (cm) {
            var STATEMENTS = ['add', 'attach', 'bind', 'detach', 'include', 'move', 'network', 'remove', 'repo', 'set', 'unbind'];

            var cursor  = cm.getCursor(),
                token   = cm.getTokenAt(cursor),
                result  = [];

            var word = token.string.trim();
            if (token.state.expect.length === 0) {
                STATEMENTS.forEach(function (stmt) {
                    if (stmt.startsWith(word)) {
                        result.push(stmt);
                    }
                });
            }

            switch (token.state.currentStatement) {
                case 'add':
                    var tdefs = model.typeDefinitions.iterator();
                    while (tdefs.hasNext()) {
                        var tdefName = tdefs.next().name;
                        if (result.indexOf(tdefName) === -1) {
                            result.push(tdefName);
                        }
                    }
                    break;

                case 'attach':
                case 'detach':
                case 'set':
                case 'remove':
                case 'bind':
                case 'unbind':
                case 'move':
                case 'network':
                    token.state.varList.forEach(function (varName) {
                        if (result.indexOf(varName) === -1) {
                            result.push(varName);
                        }
                    });
                    break;

                case 'repo':
                    result.push('"http://repo1.maven.org/maven2"');
                    break;
            }

            return {
                list: result,
                from: CodeMirror.Pos(cursor.line, cursor.ch - word.length),
                to: CodeMirror.Pos(cursor.line, token.end)
            };
        });
    }
});

module.exports = KevsHint;
