angular.module('editorApp')
	.run(function () {
		CodeMirror.defineMode('kevscript', function () {
			var STATES = {
				start: [
					{ regex: /\/\/.*/, token: 'comment' },
					{
						regex: /add/,
						token: 'statement',
						push: 'addStmt',
						process: function (state) {
							state.stmt = 'add';
							state.instancePath = [];
						}
					},
					{
						regex: /set/,
						token: 'statement',
						push: 'setStmt',
						process: function (state) {
							state.stmt = 'set';
							state.instancePath = [];
						}
					},
					{
						regex: /attach/,
						token: 'statement',
						push: 'attachStmt',
						process: function (state) {
							state.stmt = 'attach';
							state.instancePath = [];
						}
					},
					{
						regex: /detach/,
						token: 'statement',
						push: 'detachStmt',
						process: function (state) {
							state.stmt = 'detach';
							state.instancePath = [];
						}
					},
					{
						regex: /move/,
						token: 'statement',
						push: 'moveStmt',
						process: function (state) {
							state.stmt = 'move';
							state.instancePath = [];
						}
					},
					{
						regex: /start/,
						token: 'statement',
						push: 'startStmt',
						process: function (state) {
							state.stmt = 'start';
							state.instancePath = [];
						}
					},
					{
						regex: /stop/,
						token: 'statement',
						push: 'stopStmt',
						process: function (state) {
							state.stmt = 'stop';
							state.instancePath = [];
						}
					},
					{
						regex: /pause/,
						token: 'statement',
						push: 'pauseStmt',
						process: function (state) {
							state.stmt = 'pause';
							state.instancePath = [];
						}
					},
					{
						regex: /remove/,
						token: 'statement',
						push: 'removeStmt',
						process: function (state) {
							state.stmt = 'remove';
							state.instancePath = [];
						}
					},
					{
						regex: /bind/,
						token: 'statement',
						push: 'bindStmt',
						process: function (state) {
							state.stmt = 'bind';
							state.instancePath = [];
						}
					},
					{
						regex: /unbind/,
						token: 'statement',
						push: 'unbindStmt',
						process: function (state) {
							state.stmt = 'unbind';
							state.instancePath = [];
						}
					},
					{
						regex: /repo/,
						token: 'statement',
						push: 'repoStmt',
						process: function (state) {
							state.stmt = 'repo';
							state.instancePath = [];
						}
					},
					{
						regex: /include/,
						token: 'statement',
						push: 'includeStmt',
						process: function (state) {
							state.stmt = 'include';
							state.instancePath = [];
						}
					},
					{
						regex: /network/,
						token: 'statement',
						push: 'networkStmt',
						process: function (state) {
							state.stmt = 'network';
							state.instancePath = [];
						}
					},
					{
						regex: /[a-z]+/
					}
				],
				addStmt: [
					{
						regex: /,/,
						token: 'delimiter'
					},
					{
						regex: /:/,
						token: 'delimiter',
						next: 'typedef'
					},
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						push: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
				],
				setStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						push: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
					{
						regex: /=/,
						token: 'delimiter',
						next: 'value'
					}
				],
				repoStmt: [
					{
						regex: /"(?:[^\\]|\\.)*?(?:"|$)/,
						token: 'string',
						pop: true
					},
					{
						regex: /'(?:[^\\]|\\.)*?(?:'|$)/,
						token: 'string',
						pop: true
					}
				],
				includeStmt: [
					{
						regex: /([a-zA-Z0-9_-]+)(:)([a-zA-Z0-9.:%@_-]+$)/,
						token: ['version', 'delimiter', 'network'],
						pop: true
					},
				],
				networkStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'network'
					}
				],
				attachStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'namelistInstancepath',
					}
				],
				detachStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'namelistInstancepath'
					}
				],
				moveStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'namelistInstancepath'
					}
				],
				removeStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'namelist'
					}
				],
				startStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'namelist'
					}
				],
				stopStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'namelist'
					}
				],
				pauseStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'namelist'
					}
				],
				bindStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'instancepathInstancepath',
						process: function (state) {
							state.instancePath = [];
						}
					}
				],
				unbindStmt: [
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'instancepathInstancepath',
						process: function (state) {
							state.instancePath = [];
						}
					}
				],
				typedef: [
					{
						regex: /([A-Z][a-zA-Z0-9]*)([/])/,
						token: ['typedef', 'delimiter'],
						next: 'tdefversion',
						process: function (state, matches) {
							state.typedef = matches[1];
						}
					},
					{
						regex: /[A-Z][a-zA-Z0-9]*/,
						token: 'typedef',
						pop: true
					},
					{
						regex: /[a-z0-9]+/,
						token: 'namespace',
						process: function (state, matches) {
							state.namespace = matches[0];
						}
					},
					{
						regex: /\./,
						token: 'delimiter'
					},
				],
				tdefversion: [
					{
						regex: /(LATEST)([/])/,
						token: ['constant', 'delimiter'],
						next: 'duversion'
					},
					{
						regex: /([0-9]+)([/])/,
						token: ['version', 'delimiter'],
						next: 'duversion'
					},
					{
						regex: /(%)([a-zA-Z0-9_-]+)(%)([/])/,
						token: ['ctxvarbracket', 'ctxvar', 'ctxvarbracket', 'delimiter'],
						next: 'duversion'
					},
					{
						regex: /(%%)([a-zA-Z0-9_-]+)(%%)([/])/,
						token: ['ctxvarbracket', 'ctxvar', 'ctxvarbracket', 'delimiter'],
						next: 'duversion'
					},
					{
						regex: /LATEST/,
						token: 'constant',
						pop: true
					},
					{
						regex: /[0-9]+/,
						token: 'version',
						pop: true
					},
					{
						regex: /(%)([a-zA-Z0-9_-]+)(%)/,
						token: ['ctxvarbracket', 'ctxvar', 'ctxvarbracket'],
						pop: true
					},
					{
						regex: /(%%)([a-zA-Z0-9_-]+)(%%)/,
						token: ['ctxvarbracket', 'ctxvar', 'ctxvarbracket'],
						pop: true
					},
					{
						regex: /[A-Z]+/
					}
				],
				duversion: [
					{
						regex: /LATEST|RELEASE/,
						token: 'constant',
						pop: true
					},
					{
						regex: /%%/,
						token: 'ctxvarbracket',
						next: 'genctxvar'
					},
					{
						regex: /%/,
						token: 'ctxvarbracket',
						next: 'ctxvar'
					},
					{
						regex: /[A-Z]+/
					}
				],
				version: [
					{
						regex: /[/]/,
						token: 'delimiter'
					},
					{
						regex: /%%/,
						token: 'ctxvarbracket',
						push: 'genctxvar',
						pop: true
					},
					{
						regex: /%/,
						token: 'ctxvarbracket',
						push: 'ctxvar',
						pop: true
					},
					{
						regex: /[0-9]+/,
						token: 'version',
						pop: true
					},
					{
						regex: /LATEST|RELEASE/,
						token: 'constant',
						pop: true
					},
				],
				value: [
					{
						regex: /'/,
						token: 'string',
						next: 'singlequote'
					},
					{
						regex: /"/,
						token: 'string',
						next: 'doublequote'
					},
					{
						regex: /%%/,
						token: 'ctxvarbracket',
						next: 'genctxvar'
					},
					{
						regex: /%/,
						token: 'ctxvarbracket',
						next: 'ctxvar'
					}
				],
				ctxvar: [
					{
						regex: /%/,
						token: 'ctxvarbracket',
						pop: true
					},
					{
						regex: /[a-zA-Z0-9_-]+/,
						token: 'ctxvar'
					}
				],
				genctxvar: [
					{
						regex: /%%/,
						token: 'ctxvarbracket',
						pop: true
					},
					{
						regex: /[a-zA-Z0-9_-]+/,
						token: 'ctxvar'
					}
				],
				singlequote: [
					{
						regex: /\\./,
						token: 'escaped'
					},
					{
						regex: /'/,
						token: 'string',
						pop: true
					},
					{
						regex: /[^\\']*/,
						token: 'string'
					}
				],
				doublequote: [
					{
						regex: /\\./,
						token: 'escaped'
					},
					{
						regex: /"/,
						token: 'string',
						pop: true
					},
					{
						regex: /[^\\"]*/,
						token: 'string'
					}
				],
				namelist: [
					{
						regex: /,/,
						token: 'delimiter'
					},
					{
						regex: /(?=[a-zA-Z0-9%*_-]*[ \t\n]*,)/,
						push: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
				],
				namelistInstancepath: [
					{
						regex: /,/,
						token: 'delimiter'
					},
					{
						regex: /(?=[a-zA-Z0-9%*_-]*[ \t\n]*,)/,
						push: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						next: 'instancepathInstancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
				],
				instancepathInstancepath: [
					{
						regex: /[ \t\n]+/,
						next: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
					{
						regex: /(?=[^ \t\n])/,
						push: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					}
				],
				instancepath: [
					{
						regex: /([*])([./])/,
						token: ['wildcard', 'delimiter']
					},
					{
						regex: /(%%)(?=[^ ]*%%[./])/,
						token: 'ctxvarbracket',
						push: 'genctxvar'
					},
					{
						regex: /(%)(?=[^ ]*%[./])/,
						token: 'ctxvarbracket',
						push: 'ctxvar'
					},
					{
						regex: /([a-zA-Z0-9_-]+)([./])/,
						token: ['identifier', 'delimiter'],
						process: function (state, matches) {
							state.instancePath.push(matches[1]);
						}
					},
					{
						regex: /%%/,
						token: 'ctxvarbracket',
						next: 'genctxvar'
					},
					{
						regex: /%/,
						token: 'ctxvarbracket',
						next: 'ctxvar'
					},
					{
						regex: /[*]/,
						token: 'wildcard',
						pop: true
					},
					{
						regex: /[a-zA-Z0-9_-]+/,
						token: 'identifier',
						process: function (state, matches) {
							state.instancePath.push(matches[0]);
						},
						pop: true
					},
				],
				network: [
					{
						regex: /[ \t\n]+/,
						next: 'networkVal'
					},
					{
						regex: /(?=[a-zA-Z0-9%*_-])/,
						push: 'instancepath',
						process: function (state) {
							state.instancePath = [];
						}
					},
				],
				networkVal: [
					{
						regex: /%/,
						token: 'ctxvarbracket',
						next: 'ctxvar'
					},
					{
						regex: /[a-zA-Z0-9.:%@_-]+/,
						token: 'network',
						pop: true
					},
				],
				meta: {
					lineComment: '//'
				}
			};

			return {
				startState: function () {
					return {
						state: 'start',
						stack: [],
					};
				},
				token: function (stream, state) {
					if (state.pending) {
						var pend = state.pending.shift();
						if (state.pending.length === 0) {
							state.pending = null;
						}
						stream.pos += pend.text.length;
						return pend.token;
					}

					var rules = STATES[state.state];
					if (rules) {
						for (var i = 0; i < rules.length; i++) {
							var rule = rules[i];
							if (rule) {
								var matches = stream.match(rule.regex);
								if (matches) {
									if (rule.next) {
										state.state = rule.next;
									} else if (rule.pop && state.stack.length > 0) {
										var item = state.stack.pop();
										state.state = item.state;
										if (typeof item.onPop === 'function') {
											item.onPop(state);
										}
									} else if (rule.push) {
										// push current state on the stack
										state.stack.push({
											state: state.state,
											onPop: rule.onPop
										});
										// replace current state with given state to 'push'
										state.state = rule.push;
									}

									if (typeof rule.process === 'function') {
										rule.process(state, matches);
									}

									if (rule.token) {
										if (matches.length > 2) {
											state.pending = [];
											for (var j = 2; j < matches.length; j++) {
												if (matches[j]) {
													state.pending.push({
														text: matches[j],
														token: rule.token[j - 1]
													});
												}
											}
											stream.backUp(matches[0].length - (matches[1] ? matches[1].length : 0));
											return rule.token[0];
										}
										if (typeof rule.token.join === 'function') {
											// rule.token is an array
											return rule.token.join(' ');
										} else {
											// rule.token is a string
											return rule.token;
										}
									}
									// no style given
									return null;
								}
							}
						}
					}

					// unable to match any rule, advance stream and return no style
					stream.next();
					return null;
				},
				copyState: function (state) {
					var s = {
						stmt: state.stmt,
						state: state.state,
						stack: state.stack.slice(),
					};
					if (state.pending) {
						s.pending = state.pending.slice();
					}
					if (state.instancePath) {
						s.instancePath = state.instancePath.slice();
					}
					if (state.namespace) {
						s.namespace = state.namespace;
					}
					if (state.typedef) {
						s.typedef = state.typedef;
					}
					return s;
				}
			};
		});
	});
