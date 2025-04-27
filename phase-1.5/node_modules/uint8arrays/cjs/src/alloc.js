'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var asUint8array = require('./util/as-uint8array.js');

function alloc(size = 0) {
  if (globalThis.Buffer != null && globalThis.Buffer.alloc != null) {
    return asUint8array.asUint8Array(globalThis.Buffer.alloc(size));
  }
  return new Uint8Array(size);
}
function allocUnsafe(size = 0) {
  if (globalThis.Buffer != null && globalThis.Buffer.allocUnsafe != null) {
    return asUint8array.asUint8Array(globalThis.Buffer.allocUnsafe(size));
  }
  return new Uint8Array(size);
}

exports.alloc = alloc;
exports.allocUnsafe = allocUnsafe;
