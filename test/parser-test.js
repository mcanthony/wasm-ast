'use strict';

var assert = require('assert');
var fixtures = require('./fixtures');

var wasmAST = require('../');

function test(source, expected, options) {
  source = fixtures.fn2str(source);

  var ast = wasmAST.parse(source, options);
  assert.deepEqual(ast, expected);
}

describe('Parser', function() {
  it('should parse basic function', function() {
    test(function() {/*
      i64 mul(i32 a, i32 b) {
        return i64.mul(i64.extend_u(a), i64.extend_u(b));
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [ {
            type: 'ParamDeclaration',
            result: { type: 'Type', name: 'i32' },
            name: { type: 'Identifier', name: 'a' }
          }, {
            type: 'ParamDeclaration',
            result: { type: 'Type', name: 'i32' },
            name: { type: 'Identifier', name: 'b' }
          } ],
          result: { type: 'Type', name: 'i64' },
          body: [
            {
              type: 'ReturnStatement',
              argument: {
                type: 'Builtin',
                result: { type: 'Type', name: 'i64' },
                method: 'mul',
                arguments: [ {
                  type: 'Builtin',
                  result: { type: 'Type', name: 'i64' },
                  method: 'extend_u',
                  arguments: [ { type: 'Identifier', name: 'a' } ]
                }, {
                  type: 'Builtin',
                  result: { type: 'Type', name: 'i64' },
                  method: 'extend_u',
                  arguments: [ { type: 'Identifier', name: 'b' } ]
                } ]
              }
            }
          ]
        }
      ]
    });
  });

  it('should index params', function() {
    test(function() {/*
      i64 second(i32 a, i32 b, i32 c) {
        return b;
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'FunctionRef', index: 0 },
          params: [
            {
              type: 'ParamDeclaration',
              result: { type: 'Type', name: 'i32' },
              name: { type: 'Param', index: 0 }
            },
            {
              type: 'ParamDeclaration',
              result: { type: 'Type', name: 'i32' },
              name: { type: 'Param', index: 1 }
            },
            {
              type: 'ParamDeclaration',
              result: { type: 'Type', name: 'i32' },
              name: { type: 'Param', index: 2 }
            }
          ],
          result: { type: 'Type', name: 'i64' },
          body: [
            {
              type: 'ReturnStatement',
              argument: {
                type: 'Param', index: 1
              }
            }
          ]
        }
      ]
    }, {
      index: true
    });
  });

  it('should parse literal', function() {
    test(function() {/*
      i64 mul() {
        return i64.const(1);
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [],
          result: { type: 'Type', name: 'i64' },
          body: [
            {
              type: 'ReturnStatement',
              argument: {
                type: 'Builtin',
                result: { type: 'Type', name: 'i64' },
                method: 'const',
                arguments: [ {
                  type: 'Literal',
                  value: 1
                } ]
              }
            }
          ]
        }
      ]
    });
  });

  it('should parse SequenceExpression', function() {
    test(function() {/*
      i64 mul() {
        return (i64.const(1), i64.const(2), i64.const(3));
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [],
          result: { type: 'Type', name: 'i64' },
          body: [
            {
              type: 'ReturnStatement',
              argument: {
                type: 'SequenceExpression',
                expressions: [
                  {
                    type: 'Builtin',
                    result: { type: 'Type', name: 'i64' },
                    method: 'const',
                    arguments: [ {
                      type: 'Literal',
                      value: 1
                    } ]
                  },
                  {
                    type: 'Builtin',
                    result: { type: 'Type', name: 'i64' },
                    method: 'const',
                    arguments: [ {
                      type: 'Literal',
                      value: 2
                    } ]
                  },
                  {
                    type: 'Builtin',
                    result: { type: 'Type', name: 'i64' },
                    method: 'const',
                    arguments: [ {
                      type: 'Literal',
                      value: 3
                    } ]
                  }
                ]
              }
            }
          ]
        }
      ]
    });
  });

  it('should parse VariableDeclaration', function() {
    test(function() {/*
      void mul() {
        i64 a = i64.const(1);
        i64 b;
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [],
          result: { type: 'Type', name: 'void' },
          body: [
            {
              id: {
                name: 'a',
                type: 'Identifier'
              },
              result: {
                type: 'Type',
                name: 'i64'
              },
              init: {
                type: 'Builtin',
                result: { type: 'Type', name: 'i64' },
                method: 'const',
                arguments: [ {
                  type: 'Literal',
                  value: 1
                } ]
              },
              type: 'VariableDeclaration'
            },
            {
              id: {
                name: 'b',
                type: 'Identifier'
              },
              result: {
                type: 'Type',
                name: 'i64'
              },
              init: null,
              type: 'VariableDeclaration'
            }
          ]
        }
      ]
    });
  });

  it('should parse AssignmentExpression', function() {
    test(function() {/*
      void mul() {
        a = b = c;
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [],
          result: { type: 'Type', name: 'void' },
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: { type: 'Identifier', name: 'a' },
                right: {
                  type: 'AssignmentExpression',
                  operator: '=',
                  left: { type: 'Identifier', name: 'b' },
                  right: { type: 'Identifier', name: 'c' }
                }
              }
            }
          ]
        }
      ]
    });
  });

  it('should parse empty ReturnStatement', function() {
    test(function() {/*
      void mul() {
        return;
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [],
          result: { type: 'Type', name: 'void' },
          body: [
            {
              type: 'ReturnStatement',
              argument: null
            }
          ]
        }
      ]
    });
  });

  it('should parse IfStatement', function() {
    test(function() {/*
      i64 mul(i64 a) {
        if (a) {
          return a;
        } else
          return i64.const(1);
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [ {
            type: 'ParamDeclaration',
            result: { type: 'Type', name: 'i64' },
            name: { type: 'Identifier', name: 'a' }
          } ],
          result: { type: 'Type', name: 'i64' },
          body: [ {
            type: 'IfStatement',
            test: { type: 'Identifier', name: 'a' },
            consequent: {
              type: 'BlockStatement',
              body: [ {
                type: 'ReturnStatement',
                argument: { type: 'Identifier', name: 'a' }
              } ]
            },
            alternate: {
              type: 'ReturnStatement',
              argument: {
                type: 'Builtin',
                result: { type: 'Type', name: 'i64' },
                method: 'const',
                arguments: [ {
                  type: 'Literal',
                  value: 1
                } ]
              }
            }
          } ]
        }
      ]
    });
  });

  it('should parse blockless IfStatement', function() {
    test(function() {/*
      i64 mul(i64 a) {
        if (a)
          return a;
        else
          return i64.const(1);
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [ {
            type: 'ParamDeclaration',
            result: { type: 'Type', name: 'i64' },
            name: { type: 'Identifier', name: 'a' }
          } ],
          result: { type: 'Type', name: 'i64' },
          body: [ {
            type: 'IfStatement',
            test: { type: 'Identifier', name: 'a' },
            consequent: {
              type: 'ReturnStatement',
              argument: { type: 'Identifier', name: 'a' }
            },
            alternate: {
              type: 'ReturnStatement',
              argument: {
                type: 'Builtin',
                result: { type: 'Type', name: 'i64' },
                method: 'const',
                arguments: [ {
                  type: 'Literal',
                  value: 1
                } ]
              }
            }
          } ]
        }
      ]
    });
  });

  it('should parse forever loop', function() {
    test(function() {/*
      i64 mul() {
        i64 t = i64.const(1);
        forever {
          t = i64.add(t, t);
        }

        // Not going to happen
        return t;
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          localCount: 0,
          name: { type: 'Identifier', name: 'mul' },
          params: [ ],
          result: { type: 'Type', name: 'i64' },
          body: [
            {
              type: 'VariableDeclaration',
              id: {
                name: 't',
                type: 'Identifier'
              },
              result: {
                type: 'Type',
                name: 'i64'
              },
              init: {
                type: 'Builtin',
                result: { type: 'Type', name: 'i64' },
                method: 'const',
                arguments: [ {
                  type: 'Literal',
                  value: 1
                } ]
              }
            },
            {
              type: 'ForeverStatement',
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: {
                      type: 'AssignmentExpression',
                      operator: '=',
                      left: { type: 'Identifier', name: 't' },
                      right: {
                        type: 'Builtin',
                        result: { type: 'Type', name: 'i64' },
                        method: 'add',
                        arguments: [ {
                          type: 'Identifier', name: 't'
                        }, {
                          type: 'Identifier', name: 't'
                        } ]
                      }
                    }
                  }
                ]
              }
            },
            {
              type: 'ReturnStatement',
              argument: { type: 'Identifier', name: 't' }
            }
          ]
        }
      ]
    });
  });

  it('should parse forever loop with break/continue', function() {
    test(function() {/*
      void mul() {
        forever {
          continue;
          break;
        }
      }
    */}, {
      type: 'Program',
      body: [
        {
          type: 'Function',
          result: {
            type: 'Type',
            name: 'void'
          },
          name: {
            type: 'Identifier',
            name: 'mul'
          },
          params: [],
          body: [
            {
              type: 'ForeverStatement',
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ContinueStatement'
                  },
                  {
                    type: 'BreakStatement'
                  }
                ]
              }
            }
          ],
          localCount: 0
        }
      ]
    });
  });
});
