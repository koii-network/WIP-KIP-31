# Timestamp for 64-bit time_t, nanosecond precision and strftime

[![npm version](https://badge.fury.io/js/timestamp-nano.svg)](https://badge.fury.io/js/timestamp-nano)
[![npm version](https://img.shields.io/npm/v/timestamp-nano)](https://www.npmjs.com/package/timestamp-nano)
[![gzip size](https://img.badgesize.io/https://unpkg.com/timestamp-nano/dist/timestamp.min.js?compression=gzip)](https://unpkg.com/timestamp-nano/dist/timestamp.min.js)

JavaScript's native `Date` will end at 275 thousand years later.
64-bit signed `time_t` still works for 292 billion years, on the other hand.
`Date` has only milliseconds precision since 20th century.
Now we need longer range and higher precisions.
Try **[Live Demo](https://kawanet.github.io/timestamp-nano/demo/index.html)** now!

### Features

- Longer range for `time_t`: `+292277026596-12-04T15:30:07Z`
- Nanoseconds precision: `1970-01-01T00:00:00.000000001Z`
- Bundled formatter: `"%Y-%m-%dT%H:%M:%S.%NZ"`, `"%a, %b %d %X %Y %z (%Z)"`
- Small: just 3KB minified [timestamp.min.js](https://rawgit.com/kawanet/timestamp-nano/master/dist/timestamp.min.js) available for Web browsers.
- No dependencies: no other module required. Portable pure JavaScript.

### Synopsis

```js
var Timestamp = require("timestamp-nano");

Timestamp.fromDate(new Date()).toJSON(); // => "2017-11-26T13:36:22.213Z"

Timestamp.fromString("2017-11-26T13:36:22.213Z").getTimeT(); // => 1511703382

// 64-bit time_t
Timestamp.fromTimeT(1511703382).writeInt64BE(); // => [0,0,0,0,90,26,195,86]

Timestamp.fromInt64BE([0,0,0,0,90,26,195,86]).toDate().getUTCHours(); // => 13

// nanoseconds precision
Timestamp.fromInt64LE([86,195,26,90,0,0,0,0]).addNano(123456789).toJSON(); // => "2017-11-26T13:36:22.123456789Z"

Timestamp.fromString("2017-11-26T13:36:22.123456789Z").getNano(); // => 123456789
```

### Live Demo

- [https://kawanet.github.io/timestamp-nano/demo/index.html](https://kawanet.github.io/timestamp-nano/demo/index.html)

### Documentation

- [https://kawanet.github.io/timestamp-nano/typedoc/classes/timestamp.html](https://kawanet.github.io/timestamp-nano/typedoc/classes/timestamp.html)

### Format Specifiers

`toString()` method accepts `strftime` specifier characters as below.

- `%%` - Literal `%` character.
- `%a` - Abbreviated weekday name: `Sun` to `Sat`
- `%b` - Abbreviated month name: `Jan` to `Dec`
- `%d` - Day: `01` to `31` (padded with zero)
- `%e` - Day: ` 1` to `31` (padded with space)
- `%F` - Equivalent to `%Y-%m-%d`
- `%H` - Hour: `00` to `23`
- `%L` - Milliseconds: `000` to `999`
- `%M` - Minute: `00` to `59`
- `%m` - Month: `01` to `12`
- `%N` - Nanoseconds: `000000000` to `999999999`
- `%n` - Newline character
- `%R` - Equivalent to `%H:%M`
- `%S` - Second: `00` to `59`
- `%T` - Equivalent to `%H:%M:%S`
- `%t` - Tab character
- `%X` - Equivalent to `%T`
- `%Y` - Year: `0000` to `9999`, or `+275760`, `-271821`, etc.
- `%Z` - Constant timezone name: `GMT`
- `%z` - Constant timezone offset: `+0000`

### Node.js

- [https://www.npmjs.com/package/timestamp-nano](https://www.npmjs.com/package/timestamp-nano)

```sh
npm install timestamp-nano --save
```

### Browsers

- [https://rawgit.com/kawanet/timestamp-nano/master/dist/timestamp.min.js](https://rawgit.com/kawanet/timestamp-nano/master/dist/timestamp.min.js)

```html
<script src="https://rawgit.com/kawanet/timestamp-nano/master/dist/timestamp.min.js"></script>
<script>
  var dt = new Date();
  var ts = Timestamp.fromDate(dt);
  alert(ts.toString());
</script>
```

### GitHub

- [https://github.com/kawanet/timestamp-nano](https://github.com/kawanet/timestamp-nano)

### See Also

- [https://www.npmjs.com/package/int64-buffer](https://www.npmjs.com/package/int64-buffer) - for 64bit `time_t` long long value
- [https://www.npmjs.com/package/strftime](https://www.npmjs.com/package/strftime) - for formatting with timezone or locale
- [https://github.com/kawanet/cdate](https://github.com/kawanet/cdate) - cdate - a compact calendar date and strftime

### The MIT License (MIT)

Copyright (c) 2017-2022 Yusuke Kawasaki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
