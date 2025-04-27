'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function asUint8Array(buf) {
  if (globalThis.Buffer != null) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  return buf;
}

exports.asUint8Array = asUint8Array;
