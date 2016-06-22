/*
 * Simple Filtering Grammar
 * ==========================
 *
 * Accepts expressions like:
 *  - "foo"
 *  - "is:node & name:foo"
 *  - "foo & version:1.2.3"
 *  - "is:comp & bound:chan"
 */

Query
  = head:Expr tail:(_ '|' _ Expr)* {
  	  if (tail.length > 0) {
        return {
          type: 'or',
          content: [head].concat(tail.map(function (e, i) {
            return tail[i][3];
          }))
        };
      }
      return head;
    }

Expr
  = head:Term tail:(_ '&' _ Term)* {
	  if (tail.length > 0) {
        return {
          type: 'and',
          content: [head].concat(tail.map(function (e, i) {
            return tail[i][3];
          }))
        };
      }
      return head;
    }

Term
  = '(' _ query:Query _ ')' { return query; }
  / Filter

Filter
  = Is
  / Version
  / Bound
  / Tag
  / Name

Name 'name:'
  = 'name:' id:IdentifierOrRegex {
      return { type: 'name', content: id };
    }

Is 'is:'
  = 'is:' id:Identifier {
      return { type: 'is', content: id };
    }

Version 'vers:'
  = 'vers:' op:('>'/'<'/'>='/'<=')? id:IdentifierOrRegex {
      var expr = { type: 'vers', content: id };
      if (op === '>')  { expr.operator = 'gt'; }
      if (op === '<')  { expr.operator = 'lt'; }
      if (op === '>=') { expr.operator = 'ge'; }
      if (op === '<=') { expr.operator = 'le'; }
      return expr;
    }

Tag 'tag:'
  = 'tag:' id:IdentifierOrRegex {
      return { type: 'tag', content: id };
    }

Bound 'bound:'
  = 'bound:' target:Identifier ':' id:IdentifierOrRegex {
      return { type: 'bound', target: target, content: id };
    }

IdentifierOrRegex 'identifier or regex'
  = Identifier
  / RegularExpressionLiteral

Identifier 'identifier'
  = [a-zA-Z0-9\.]+ { return text(); }

RegularExpressionLiteral "regular expression"
  = "/" pattern:$RegularExpressionBody "/" flags:('g'/'m'/'i'/'') {
      var value;

      try {
        value = new RegExp(pattern, flags);
      } catch (e) {
        error(e.message);
      }

      return { type: "regex", content: value };
    }

RegularExpressionBody
  = RegularExpressionFirstChar RegularExpressionChar*

RegularExpressionFirstChar
  = ![*\\/[] RegularExpressionNonTerminator
  / RegularExpressionBackslashSequence
  / RegularExpressionClass

RegularExpressionChar
  = ![\\/[] RegularExpressionNonTerminator
  / RegularExpressionBackslashSequence
  / RegularExpressionClass

RegularExpressionBackslashSequence
  = "\\" RegularExpressionNonTerminator

RegularExpressionNonTerminator
  = !LineTerminator SourceCharacter

RegularExpressionClass
  = "[" RegularExpressionClassChar* "]"

RegularExpressionClassChar
  = ![\]\\] RegularExpressionNonTerminator
  / RegularExpressionBackslashSequence

LineTerminator
  = [\n\r\u2028\u2029]

SourceCharacter
  = .

_ 'whitespace'
  = [ \t]*
