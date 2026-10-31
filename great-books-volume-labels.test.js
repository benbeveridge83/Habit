const assert = require('assert');
const labels = require('./great-books-volume-labels.js');

const expected = {
  '2': 'Imaginative Literature I',
  '3': 'Imaginative Literature II',
  '4': 'Imaginative Literature III',
  '5': 'Critical Essays',
  '6': 'Man and Society I',
  '7': 'Man and Society II',
  '8': 'Natural Science',
  '9': 'Mathematics',
  '10': 'Philosophical Essays'
};
for (const [volume, title] of Object.entries(expected)) {
  assert.equal(labels.volumeLabel({collection:'gateway', volume}), title, `Gateway volume ${volume}`);
}
assert.equal(labels.volumeLabel({collection:'greatbooks', volume:'8', collectionLabel:'Great Books of the Western World'}), 'Great Books of the Western World');
assert.equal(labels.volumeLabel({collection:'gateway', volume:'99', collectionLabel:'Gateway to the Great Books'}), 'Gateway to the Great Books');
console.log('great-books-volume-labels tests passed');
