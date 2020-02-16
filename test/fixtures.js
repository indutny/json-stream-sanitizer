'use strict';

const assert = require('assert');
const { Buffer } = require('buffer');

const Sanitizer = require('../');

exports.scan = async function scan(input) {
  input = Buffer.from(input);

  let last = null;
  let lastError = null;

  for (let step = 1; step < input.length; step++) {
    const sanitizer = new Sanitizer(/bad/g, 'good');

    const end = new Promise((resolve, reject) => {
      let output = '';
      sanitizer.on('data', (chunk) => {
        output += chunk;
      });

      sanitizer.on('end', () => {
        resolve(output);
      });

      sanitizer.on('error', (err) => {
        reject(err);
      });
    });

    for (let offset = 0; offset < input.length; offset += step) {
      sanitizer.write(input.slice(offset, offset + step));
    }
    sanitizer.end();

    let output;
    try {
      output = await end;
    } catch (err) {
      if (lastError !== null) {
        assert.strictEqual(err.message, lastError.message);
      }

      lastError = err;
      continue;
    }

    if (lastError !== null) {
      throw new Error('Inconsistent error reporting');
    }

    if (last !== null) {
      assert.strictEqual(output, last,
        `Output should match for different steps (Step size: ${step})`);
    }
    last = output;
  }

  if (lastError) {
    throw lastError;
  }

  return last;
};
