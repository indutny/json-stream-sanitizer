# json-stream-sanitizer
[![Build Status](https://secure.travis-ci.org/indutny/json-stream-sanitizer.svg)](http://travis-ci.org/indutny/json-stream-sanitizer)

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

## Benchmarks

```
$ npm run bench
...
Throughput: 36.45 mb/s (±2.76 %)
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
