# json-stream-sanitizer
[![Build Status](https://secure.travis-ci.org/indutny/json-stream-sanitizer.svg)](http://travis-ci.org/indutny/json-stream-sanitizer)
[![NPM version](https://badge.fury.io/js/json-stream-sanitizer.svg)](https://badge.fury.io/js/json-stream-sanitizer)
![License](https://img.shields.io/npm/l/json-stream-sanitizer)

Sanitize strings in JSON stream.

## Usage

```js
const Sanitizer = require('json-stream-sanitizer');

// First argument - pattern
// Second argument - replacement
// (Just as for `String.prototype.replace`)
const sanitizer = new Sanitizer(/bad-string/g, 'good-string');

sanitizer.pipe(process.stdout);

sanitizer.write('{\n');
sanitizer.write('  "bad-string": "value",\n');
sanitizer.write('  "other-string": "other-value"\n');
sanitizer.end('}');
```

Alternatively a custom "sanitize" function can be passed as the first argument
to the constructor:
```js
const sanitizer = new Sanitizer((string) => {
  return string.replace(/bad/g, 'good')
    .replace(/war/g, 'peace');
});
```

## Benchmarks

```
$ npm run bench
...
Throughput: 38.62 mb/s (±1.89 %)
```

#### LICENSE

This software is licensed under the MIT License.

Copyright Fedor Indutny, 2020.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
