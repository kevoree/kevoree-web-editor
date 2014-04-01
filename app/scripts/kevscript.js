/**
 * CodeMirror KevScript mode (lexer)
 * Created by leiko on 31/03/14.
 */
CodeMirror.defineMode('kevscript', function () {
    var TOKENS      = /repo|include|add|remove|move|set|attach|detach|network|bind|unbind|namespace/,
        STRING      = /"((?!").)+"|'((?!').)+'/,
        COMMENT     = /\/\/((?!(\r\n|\n|\r)).)+/,
        OPERATORS   = /[:=,]/,
        SPECIAL     = /\*/;

    return {
        token: function (stream, state) {
            if (stream.match(TOKENS, true)) {
                return 'keyword';
            } else if (stream.match(STRING, true)) {
                return 'string';
            } else if (stream.match(COMMENT, true)) {
                return 'comment';
            } else if (stream.match(OPERATORS, true)) {
                return 'text';
            } else if (stream.match(SPECIAL, true)) {
                return 'special';
            }

            stream.next();
            return 'text';
        },
        startState: function () {
            return {};
        }
    };
});