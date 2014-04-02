(function (CodeMirror) {
    /**
     * CodeMirror KevScript mode (lexer)
     * Created by leiko on 31/03/14.
     */
    CodeMirror.defineMode('kevscript', function () {
        var REGEX = {
            statement:      /repo|include|add|remove|move|set|attach|detach|network|bind|unbind/,
            string:         /"((?!").)*"|'((?!').)*'/,
            comment:        /\/\/((?!(\r\n|\n|\r)).)*/,
            equal:          /=/,
            colon:          /:/,
            slash:          /[/]/,
            typedefslash:   /[/](?![/])/,
            instancelist:   /((\*|[a-zA-Z0-9_-]+)([.](\*|[a-zA-Z0-9_-]+))*)((([ ]|\t)*)(,(([ ]|\t)*)((\*|[a-zA-Z0-9_-]+)([.](\*|[a-zA-Z0-9_-]+))*)))*/,
            typedef:        /[a-zA-Z0-9_-]+/,
            instancepath:   /(\*|[a-zA-Z0-9_-]+)([.](\*|[a-zA-Z0-9_-]+))*/,
            string2:        /[a-zA-Z0-9.:@_-]+/,
            string1:        /[a-zA-Z0-9_-]+/,
            version:        /[a-zA-Z0-9._-]+/
        };

        var statements = {
            repo: function (stream, state) {
                state.expect = ['string'];
                return 'statement';
            },

            include: function (stream, state) {
                state.expect = ['string1', 'colon', 'string2'];
                return 'statement';
            },

            add: function (stream, state) {
                state.expect = ['instancelist', 'colon', 'typedef'];
                return 'statement';
            },

            typedef: function (stream, state) {
                if (stream.string.contains('/')) {
                    state.expect = ['?typedefslash'];
                }
                return 'typedef';
            },

            typedefslash: function (stream, state) {
                state.expect = ['version'];
                return null;
            },

            move: function (stream, state) {
                state.expect = ['instancelist', 'instancepath'];
                return 'statement';
            },

            remove: function (stream, state) {
                state.expect = ['instancelist'];
                return 'statement';
            },

            attach: function (stream, state) {
                state.expect = ['instancelist', 'instancepath'];
                return 'statement';
            },

            detach: function (stream, state) {
                state.expect = ['instancelist', 'instancepath'];
                return 'statement';
            },

            set: function (stream, state) {
                state.expect = ['instancepath', '?slash', 'equal', 'string'];
                return 'statement';
            },

            network: function (stream, state) {
                state.expect = ['instancepath', 'string2'];
                return 'statement';
            },

            bind: function (stream, state) {
                state.expect = ['instancepath', 'instancepath'];
                return 'statement';
            },

            unbind: function (stream, state) {
                state.expect = ['instancepath', 'instancepath'];
                return 'statement';
            },

            slash: function (stream, state) {
                state.expect = ['instancepath', 'equal', 'string'];
                return null;
            },

            instancelist: function (stream, state) {
                if (state.currentStatement === 'add') {
                    // add nodeList content to state.varList on 'add'
                    var varList = stream.current().split(',').map(function (item) {
                        return item.trim();
                    });
                    state.varList = state.varList.concat(varList);
                }
                return 'instancelist';
            },

            string: function () {
                return 'string';
            },

            string1: function () {
                return 'string1';
            },

            string2: function () {
                return 'string2';
            },

            version: function () {
                return 'version';
            },

            instancepath: function () {
                return 'instancepath';
            },

            colon: function () {
                return null;
            },

            equal: function () {
                return null;
            },

            comment: function () {
                return 'comment';
            }
        };

        return {
            token: function (stream, state) {
                var statement;

                if (stream.eatSpace()) {
                    // first of all, get rid of spaces
                    return null;

                } else if (state.expect.length === 0) {
                    state.currentStatement = null;
                    // nothing expected, look for a new statement
                    if (stream.match(REGEX['statement'], false)) {
                        statement = stream.match(REGEX['statement'], true);
                        if (statement) {
                            state.currentStatement = statement[0];
                            return statements[statement[0]](stream, state);
                        } else {
                            return 'error';
                        }
                    } else if (stream.match(REGEX['comment'], false)) {
                        statement = stream.match(REGEX['comment'], true);
                        if (statement) {
                            state.currentStatement = statement[0];
                            return statements['comment'](stream, state);
                        } else {
                            return 'error';
                        }
                    } else {
                        stream.skipToEnd();
                        return 'error';
                    }

                } else if (state.expect.length > 0) {
                    var optional = false;
                    // we are currently expecting something, check if stream matches expectations
                    var expected = state.expect.splice(0, 1)[0]; // pop() first value (fifo)
                    if (expected[0] === '?') {
                        // this is optional
                        expected = expected.substr(1, expected.length-1);
                        optional = true;
                    }

                    if (expected === 'string' && state.currentStatement === 'set') {
                        // special case for string in "set" statements
                        if (!state.inString) {
                            if (stream.peek() === '"') {
                                stream.next();
                                state.stringTag = '"';
                                state.inString = true;
                            } else if (stream.peek() === '\'') {
                                stream.next();
                                state.stringTag = '\'';
                                state.inString = true;
                            }
                        }

                        if (state.inString) {
                            if (stream.skipTo(state.stringTag)) { // Quote found on this line
                                stream.next();          // Skip quote
                                state.inString = false; // Clear flag
                                state.currentStatement = null;
                                state.stringTag = null;
                            } else {
                                state.expect.splice(0, 0, expected);
                                stream.skipToEnd();    // Rest of line is string
                            }
                            return 'string';          // Token style
                        } else {
                            stream.skipTo(state.stringTag) || stream.skipToEnd();
                            return null;              // Unstyled token
                        }

                    } else {
                        statement = stream.match(REGEX[expected], true);
                        if (statement) {
                            return statements[expected](stream, state);
                        } else {
                            if (!optional) {
                                state.expect.splice(0, 0, expected); // push() value back to its old index on fail
                                stream.skipToEnd();
                                return 'error';
                            } else {
                                return null;
                            }
                        }
                    }

                } else {
                    stream.skipToEnd();
                    return 'error';
                }
            },
            lineComment: '//',
            startState: function () {
                return {
                    expect: [],
                    currentStatement: null,
                    inString: false,
                    stringTag: null,
                    varList : []
                };
            }
        };
    });
})(CodeMirror);