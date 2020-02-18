/* eslint-env node, mocha */
const assert = require('assert');

const { scan } = require('./fixtures');

describe('json-stream-sanitizer', () => {
  it('should process input without any strings', async () => {
    assert.strictEqual(await scan('[1,2,3,4]'), '[1,2,3,4]');
  });

  it('should process input with simple strings', async () => {
    assert.strictEqual(
      await scan('["abcdefgh","bad", "okay"]'),
      '["abcdefgh","good", "okay"]');
  });

  it('should process input with escaped characters', async () => {
    assert.strictEqual(
      await scan('["\\u0444\\"","bad", "okay"]'),
      '["ф\\"","good", "okay"]');
  });

  it('should emit error on unterminated string', async () => {
    await assert.rejects(scan('["hello'), {
      message: 'Unterminated string in JSON input',
    });
  });

  it('should emit error on unterminated escape sequence', async () => {
    await assert.rejects(scan('["hello\\'), {
      message: 'Unterminated escape sequence in JSON input',
    });
  });

  it('should emit error on unterminated unicode sequence #1', async () => {
    await assert.rejects(scan('["hello\\u'), {
      message: 'Unterminated unicode escape sequence in JSON input',
    });
  });

  it('should emit error on unterminated unicode sequence #2', async () => {
    await assert.rejects(scan('["hello\\u1'), {
      message: 'Unterminated unicode escape sequence in JSON input',
    });
  });

  it('should emit error on unterminated unicode sequence #3', async () => {
    await assert.rejects(scan('["hello\\u12'), {
      message: 'Unterminated unicode escape sequence in JSON input',
    });
  });

  it('should emit error on unterminated unicode sequence #4', async () => {
    await assert.rejects(scan('["hello\\u123'), {
      message: 'Unterminated unicode escape sequence in JSON input',
    });
  });

  it('should support custom sanitize function', async () => {
    assert.strictEqual(
      await scan('["abcd"]', (s) => s.replace(/a/g, 'b').replace(/bb/g, 'cc')),
      '["cccd"]');
  });
});
