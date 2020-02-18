'use strict';

const { Buffer } = require('buffer');

const Sanitizer = require('../');

function generate(depth) {
  if (depth === 0) {
    return [ 'bad normal sized string' ];
  }

  const res = [];
  for (let i = 0; i < 50; i++) {
    res.push(generate(depth - 1));
  }
  return res;
}

async function run() {
  const input = Buffer.from(JSON.stringify(generate(4)));

  console.log('Input size: %d', input.length);

  const ITERATIONS = 10;

  const stats = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const s = new Sanitizer(/bad/g, 'good');
    s.resume();

    const end = new Promise((resolve) => {
      s.on('end', () => resolve());
    });

    const start = process.hrtime();
    s.end(input);

    await end;

    const diff = process.hrtime(start);
    const time = diff[0] + (diff[1] / 1000000000);

    const throughput = input.length / time / 1024 / 1024;
    stats.push(throughput);

    console.log(`Iteration: ${i + 1}/${ITERATIONS}, ` +
      `${throughput.toFixed(2)} mb/s`);
  }

  let mean = 0;
  let stddev = 0;
  for (const value of stats) {
    mean += value;
    stddev += value ** 2;
  }
  mean /= stats.length;
  stddev /= stats.length;
  stddev -= mean ** 2;
  stddev = Math.sqrt(stddev) / mean * 100;

  console.log(
    `Throughput: ${mean.toFixed(2)} mb/s (±${stddev.toFixed(2)} %)`);
}

run().then(() => {
}).catch((e) => {
  throw e;
});
