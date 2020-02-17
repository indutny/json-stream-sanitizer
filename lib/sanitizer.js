'use strict';

const { Transform } = require('stream');

class Sanitizer extends Transform {
  constructor(pattern, replacement) {
    super();

    this.pattern = pattern;
    this.replacement = replacement;

    this.inString = false;
    this.inEscape = false;
    this.unicodeLeft = 0;
    this.string = '';
  }

  _transform(chunk, encoding, callback) {
    let offset = 0;
    while (offset !== chunk.length) {
      if (!this.inString) {
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
        this.inString = true;
        continue;
      }

      if (this.inEscape) {
        const first = chunk[offset];

        this.string += String.fromCharCode(first);
        offset++;

        /* '\\uXXXX' */
        if (first === 0x75) {
          this.unicodeLeft = 4;
        }
        this.inEscape = false;

        continue;
      }

      // Just skip 4 characters for escaped unicode value
      if (this.unicodeLeft !== 0) {
        const eat = Math.min(chunk.length - offset, this.unicodeLeft);

        this.string += chunk.toString('utf8', offset, offset + eat);
        offset += eat;

        this.unicodeLeft -= eat;
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
        this.string += chunk.toString('utf8', offset);
        offset = chunk.length;
        continue;
      }

      // String ends before escape!
      if (end !== -1) {
        const source = this.string + chunk.toString('utf8', offset, end);
        this.string = '';
        this.inString = false;

        const sanitized = source.replace(this.pattern, this.replacement);
        this.push(`"${sanitized}"`);

        offset = end + 1;
        continue;
      }

      // Escape
      this.inEscape = true;
      this.string += chunk.toString('utf8', offset, escape + 1);
      offset = escape + 1;
    }

    callback(null);
  }

  _flush(callback) {
    if (this.inEscape) {
      return callback(new Error('Unterminated escape sequence in JSON input'));
    }
    if (this.unicodeLeft !== 0) {
      return callback(
        new Error('Unterminated unicode escape sequence in JSON input'));
    }
    if (this.inString) {
      return callback(new Error('Unterminated string in JSON input'));
    }
    if (this.string !== '') {
      return callback(new Error('Internal ReplaceStream error'));
    }
    callback(null);
  }
}
module.exports = Sanitizer;
