'use strict';

const { Buffer } = require('buffer');
const { Transform } = require('stream');

const kSanitize = Symbol('sanitize');
const kInString = Symbol('inString');
const kInEscape = Symbol('inEscape');
const kUnicodeLeft = Symbol('unicodeLeft');
const kUnicodeValue = Symbol('unicodeValue');
const kString = Symbol('string');

class Sanitizer extends Transform {
  constructor(pattern, replacement) {
    super();

    this[kSanitize] = typeof pattern === 'function' ? pattern : (str) => {
      return str.replace(pattern, replacement);
    };

    this[kInString] = false;
    this[kInEscape] = false;
    this[kUnicodeLeft] = 0;
    this[kUnicodeValue] = 0;
    this[kString] = '';
  }

  _transform(chunk, encoding, callback) {
    let offset = 0;
    while (offset !== chunk.length) {
      if (!this[kInString]) {
        // Look for the start of a string
        let start = -1;
        for (let i = offset; i < chunk.length; i++) {
          if (chunk[i] === 0x22 /* '"' */) {
            start = i;
            break;
          }
        }

        // No string found - push whole chunk
        if (start === -1) {
          this.push(chunk.slice(offset));
          offset = chunk.length;
          continue;
        }

        // Push everything before the string itself
        this.push(chunk.slice(offset, start));
        offset = start + 1;

        // Enter the string!
        this[kInString] = true;
        continue;
      }

      if (this[kInEscape]) {
        const first = chunk[offset];
        offset++;

        // '\\uXXXX'
        if (first === 0x75 /* 'u' */) {
          this[kUnicodeLeft] = 4;
        } else {
          this[kString] += '\\' + String.fromCharCode(first);
        }

        this[kInEscape] = false;

        continue;
      }

      // Just skip 4 characters for escaped unicode value
      if (this[kUnicodeLeft] !== 0) {
        const first = chunk[offset];
        offset++;

        let digit = 0;
        if (first >= 0x30 /* '0' */ && first <= 0x39 /* '9' */) {
          digit = first - 0x30;
        } else if (first >= 0x41 /* 'A' */ && first <= 0x46 /* 'F' */) {
          digit = 0x10 + first - 0x41;
        } else if (first >= 0x61 /* 'a' */ && first <= 0x66 /* 'f' */) {
          digit = 0x10 + first - 0x61;
        } else {
          throw new Error('Invalid unicode escape sequence');
        }

        this[kUnicodeValue] <<= 4;
        this[kUnicodeValue] |= digit;

        if (--this[kUnicodeLeft] === 0) {
          this[kString] += String.fromCharCode(this[kUnicodeValue]);
          this[kUnicodeValue] = 0;
        }
        continue;
      }

      // Look for the start of escape sequence
      let escape = -1;
      let end = -1;
      for (let i = offset; i < chunk.length; i++) {
        const b = chunk[i];
        if (b === 0x22 /* '"' */) {
          end = i;
          break;
        } else if (b === 0x5c /* '\\' */) {
          escape = i;
          break;
        }
      }

      // No escape, no end in sight - buffer whole chunk
      if (end === -1 && escape === -1) {
        this[kString] += chunk.toString('utf8', offset);
        offset = chunk.length;
        continue;
      }

      // String ends before escape!
      if (end !== -1) {
        const source = this[kString] + chunk.toString('utf8', offset, end);
        this[kString] = '';
        this[kInString] = false;

        const sanitized = this[kSanitize](source);
        this.push(Buffer.from(`"${sanitized}"`, 'utf8'));

        offset = end + 1;
        continue;
      }

      // Escape
      this[kInEscape] = true;
      this[kString] += chunk.toString('utf8', offset, escape);
      offset = escape + 1;
    }

    callback(null);
  }

  _flush(callback) {
    if (this[kInEscape]) {
      return callback(new Error('Unterminated escape sequence in JSON input'));
    }
    if (this[kUnicodeLeft] !== 0) {
      return callback(
        new Error('Unterminated unicode escape sequence in JSON input'));
    }
    if (this[kInString]) {
      return callback(new Error('Unterminated string in JSON input'));
    }
    if (this[kString] !== '') {
      return callback(new Error('Internal ReplaceStream error'));
    }
    callback(null);
  }
}
module.exports = Sanitizer;
