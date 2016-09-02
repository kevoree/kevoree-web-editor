'use strict';

angular.module('editorApp')
  .run(function () {
    CodeMirror.defineSimpleMode('kevscript', {
      start: [
        { regex: /\/\/.*/, token: 'comment' },
        { regex: /(%)([\w]+)(%)/, token: ['ctxvarbracket', 'ctxvar', 'ctxvarbracket'] },
        { regex: /(%%)([\w]+)(%%)/, token: ['ctxvarbracket', 'ctxvar', 'ctxvarbracket'] },
        { regex: /,|\/|:/, token: 'delimiter' },
        { regex: /(\s*)\b(add|repo|include|remove|move|set|attach|detach|network|bind|unbind|start|stop|pause)\b/, token: [null, 'statement'], sol: true },
        { regex: /LATEST|RELEASE/, token: 'constant' },
        { regex: /[A-Z]([a-zA-Z0-9]*)?/, token: 'typedef' },
        { regex: /[a-z][\w-]*(\.[a-z][\w-]*)*\.(?=[A-Z])/, token: 'namespace' },
        { regex: /'/, token: 'string', next: 'singlequote' },
        { regex: /"/, token: 'string', next: 'doublequote' },
        { regex: /[a-z][\w]*\.[a-z][\w]*\.([a-z][\w]*)?/, token: 'instancepath' },
        { regex: /[a-z][\w]*\.([a-z][\w]*)?/, token: 'instancepath' },
        { regex: /[a-z][\w]*/, token: 'instancepath' },
        { regex: /[0-9]+/, token: 'version' },
        { regex: /\*/, token: 'wildcard' }
      ],
      singlequote: [
        { regex: /\\./, token: 'escaped' },
        { regex: /'/, token: 'string', next: 'start' },
        { regex: /[^\\']*/, token: 'string' },
      ],
      doublequote: [
        { regex: /\\./, token: 'escaped' },
        { regex: /"/, token: 'string', next: 'start' },
        { regex: /[^\\"]*/, token: 'string' },
      ],
      meta: {
        lineComment: '//'
      }
    });
  });
