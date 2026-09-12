const assert = require('assert');
const fs = require('fs');
const logic = require('./logic-study.js');

assert.equal(logic.relationshipBetween('A','O'), 'Contradictories');
assert.equal(logic.relationshipBetween('A','E'), 'Contraries');
assert.equal(logic.relationshipBetween('I','O'), 'Subcontraries');
assert.equal(logic.relationshipBetween('A','I'), 'Subalternation');
assert.equal(logic.truthInference('A','True','O'), 'False');
assert.equal(logic.truthInference('A','False','O'), 'True');
assert.equal(logic.truthInference('A','True','I'), 'True');
assert.equal(logic.truthInference('A','False','I'), 'Undetermined');
assert.equal(logic.classifyConditionalForm('P','Q','P','Q'), 'Modus Ponens');
assert.equal(logic.classifyConditionalForm('P','Q','Q','P'), 'Affirming the Consequent');

const indexHtml = fs.readFileSync('./index.html','utf8');
assert(indexHtml.includes('logic-study.css'));
assert(indexHtml.includes('logic-study.js'));

console.log('logic-study tests passed');