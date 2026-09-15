const assert = require('assert');
const study = require('./logic-study-materials.js');

const identification = study.getStudyMaterial('logicSquareCats', 'identify');
assert(identification, 'A/E/I/O study material should exist');
assert(identification.html.includes('Universal affirmative'));
assert(identification.html.includes('Some S are not P'));

const relationships = study.getStudyMaterial('logicSquareCats', 'relations');
assert(relationships.html.includes('A–O'));
assert(relationships.html.includes('E–I'));
assert(relationships.html.toLowerCase().includes('contradict'));
assert(relationships.html.includes('A–I'));

const affirmingConsequent = study.getStudyMaterial('logicErrorCats', 'ac');
assert(affirmingConsequent.html.includes('P → Q'));
assert(affirmingConsequent.html.toLowerCase().includes('invalid'));

const rendered = study.renderStudyHtml([
  {groupId:'logicSquareCats', value:'identify'},
  {groupId:'logicErrorCats', value:'ac'}
]);
assert(rendered.includes('A / E / I / O identification'));
assert(rendered.includes('Affirming the Consequent'));
assert(!rendered.includes('Denying the Antecedent'));

const groups = study.getGroupConfigs();
assert.deepEqual(groups.map(x => x.id), ['logicSquareCats','logicAssertionKinds','logicErrorCats']);
assert.equal(groups.filter(x => x.mode === 'square').length, 2);
assert.equal(groups.filter(x => x.mode === 'errors').length, 1);

const expectedMaterials = {
  logicSquareCats: ['identify','relations','assertions','translate'],
  logicAssertionKinds: ['contradictory','contrary','subcontrary','subalternation','noerror'],
  logicErrorCats: ['mp','mt','ac','da','um','ilmj','ilmn','four','noerror']
};
for (const [groupId, values] of Object.entries(expectedMaterials)) {
  for (const value of values) {
    const item = study.getStudyMaterial(groupId, value);
    assert(item && item.title && item.html, `${groupId}:${value} should have study material`);
  }
}

// Regression: MutationObserver calls mount() after our own DOM insertions.
// Once all groups are already enhanced, mount() must be a no-op; otherwise
// renderModeStudy() writes innerHTML, which triggers the observer again forever.
let outlineWrites = 0;
const outline = {
  get innerHTML(){ return ''; },
  set innerHTML(value){ outlineWrites += 1; }
};
const panel = {
  querySelector(selector){ return selector === '.logicStudyOutline' ? outline : null; }
};
const modeEl = {
  querySelector(){ return panel; }
};
const enhancedSource = { dataset:{logicStudyEnhanced:'1'} };
const emptyDualList = { querySelectorAll(){ return []; } };
const fakeDoc = {
  getElementById(id){
    if(['logicSquareCats','logicAssertionKinds','logicErrorCats'].includes(id)) return enhancedSource;
    if(['logicModeSquare','logicModeErrors'].includes(id)) return modeEl;
    return null;
  },
  querySelector(selector){
    return selector.startsWith('[data-logic-dual-group=') ? emptyDualList : null;
  },
  querySelectorAll(){ return []; }
};
assert.equal(study.mount(fakeDoc), false, 'nothing new should be mounted once Logic groups are enhanced');
assert.equal(outlineWrites, 0, 'an observer-triggered no-op mount must not rewrite study DOM');

console.log('logic study materials tests passed');
