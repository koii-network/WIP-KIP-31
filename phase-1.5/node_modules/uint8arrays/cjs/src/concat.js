'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var alloc = require('./alloc.js');
var asUint8array = require('./util/as-uint8array.js');

function concat(arrays, length) {
  if (!length) {
    length = arrays.reduce((acc, curr) => acc + curr.length, 0);
  }
  const output = alloc.allocUnsafe(length);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return asUint8array.asUint8Array(output);
}

exports.concat = concat;
