const assert = require('assert');
const fs = require('fs');
const logic = require('./logic-study.js');
const filterControls = require('./logic-filter-controls.js');

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

const filters = logic.getAssertionFilterOptions();
assert.deepEqual(filters.map(x => x.id), ['contradictory','contrary','subcontrary','subalternation','noerror']);
for (const id of ['contradictory','contrary','subcontrary','subalternation','noerror']) {
  const q = logic.makeSquareAssertion(id, 'students', 'readers');
  assert(!q.stem.includes('?'), `${id} should be an assertion, not a question`);
  assert(!/^If\b/i.test(q.stem), `${id} should not begin like a test-style conditional prompt`);
  assert(q.stem.includes('students'));
  assert(q.stem.includes('readers'));
}
assert.equal(logic.makeSquareAssertion('contradictory','students','readers').answer, 'Contradictory error');
assert.equal(logic.makeSquareAssertion('contrary','students','readers').answer, 'Contrary error');
assert.equal(logic.makeSquareAssertion('subcontrary','students','readers').answer, 'Subcontrary error');
assert.equal(logic.makeSquareAssertion('subalternation','students','readers').answer, 'Subalternation error');
assert.equal(logic.makeSquareAssertion('noerror','students','readers').answer, 'No error / valid reasoning');

const conditional = logic.makeReasoningAssertion('ac');
assert(!conditional.stem.includes('?'));
assert(!/^Identify\b|^Is this\b/i.test(conditional.stem));
assert.equal(logic.makeReasoningAssertion('noerror').answer, 'No error / valid reasoning');

assert.equal(typeof filterControls.setGroupChecked, 'function');
assert.equal(typeof filterControls.addGroupControls, 'function');
assert.equal(typeof filterControls.validateBeforeNew, 'function');

const fakeBoxes = [{checked:false},{checked:false},{checked:false}];
const fakeGroup = { querySelectorAll(){ return fakeBoxes; } };
assert.equal(filterControls.setGroupChecked(fakeGroup, true), 3);
assert(fakeBoxes.every(x => x.checked === true));
filterControls.setGroupChecked(fakeGroup, false);
assert(fakeBoxes.every(x => x.checked === false));

const indexHtml = fs.readFileSync('./index.html','utf8');
assert(indexHtml.includes('logic-study.css'));
assert(indexHtml.includes('logic-study.js'));
assert(indexHtml.includes('logic-filter-controls.js'));

console.log('logic-study tests passed');