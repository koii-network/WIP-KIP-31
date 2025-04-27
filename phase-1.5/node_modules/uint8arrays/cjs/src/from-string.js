'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var bases = require('./util/bases.js');
var asUint8array = require('./util/as-uint8array.js');

function fromString(string, encoding = 'utf8') {
  const base = bases[encoding];
  if (!base) {
    throw new Error(`Unsupported encoding "${ encoding }"`);
  }
  if ((encoding === 'utf8' || encoding === 'utf-8') && globalThis.Buffer != null && globalThis.Buffer.from != null) {
    return asUint8array.asUint8Array(globalThis.Buffer.from(string, 'utf-8'));
  }
  return base.decoder.decode(`${ base.prefix }${ string }`);
}

exports.fromString = fromString;
