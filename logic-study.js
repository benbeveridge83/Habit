(function(root,factory){
  const questionBank=typeof module==='object'&&module.exports?require('./logic-question-bank.js'):root.HabitLogicQuestionBank;
  const api=factory(questionBank);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root){root.HabitLogicStudy=api;if(root.document)api.init();}
})(typeof window!=='undefined'?window:globalThis,function(questionBank){
  const REL={AO:'Contradictories',EI:'Contradictories',AE:'Contraries',IO:'Subcontraries',AI:'Subalternation',EO:'Subalternation'};
  const ASSERTION_FILTERS=[
    {id:'contradictory',label:'Contradictory error'},
    {id:'contrary',label:'Contrary error'},
    {id:'subcontrary',label:'Subcontrary error'},
    {id:'subalternation',label:'Subalternation error'},
    {id:'noerror',label:'No error / valid reasoning'}
  ];
  const ASSERTION_CHOICES=ASSERTION_FILTERS.map(x=>x.label);
  const ERROR_FILTERS=[
    ['mp','Modus Ponens'],['mt','Modus Tollens'],['ac','Affirming the Consequent'],['da','Denying the Antecedent'],
    ['um','Undistributed Middle'],['ilmj','Illicit Major'],['ilmn','Illicit Minor'],['four','Four-Term Fallacy'],['noerror','No error / valid reasoning']
  ];
  function relationshipBetween(a,b){return REL[[a,b].sort().join('')]||'No direct square relationship';}
  function truthInference(from,truth,target){
    if(from===target)return truth;
    const rel=relationshipBetween(from,target);
    if(rel==='Contradictories')return truth==='True'?'False':'True';
    if(rel==='Contraries')return truth==='True'?'False':'Undetermined';
    if(rel==='Subcontraries')return truth==='False'?'True':'Undetermined';
    if(from==='A'&&target==='I')return truth==='True'?'True':'Undetermined';
    if(from==='E'&&target==='O')return truth==='True'?'True':'Undetermined';
    if(from==='I'&&target==='A')return truth==='False'?'False':'Undetermined';
    if(from==='O'&&target==='E')return truth==='False'?'False':'Undetermined';
    return 'Undetermined';
  }
  function classifyConditionalForm(p,q,premise2,conclusion){
    if(premise2===p&&conclusion===q)return 'Modus Ponens';
    if(premise2==='not '+q&&conclusion==='not '+p)return 'Modus Tollens';
    if(premise2===q&&conclusion===p)return 'Affirming the Consequent';
    if(premise2==='not '+p&&conclusion==='not '+q)return 'Denying the Antecedent';
    return 'Unknown';
  }
  function getAssertionFilterOptions(){return ASSERTION_FILTERS.map(x=>({...x}));}
  const prop=(t,s,p)=>t==='A'?`All ${s} are ${p}.`:t==='E'?`No ${s} are ${p}.`:t==='I'?`Some ${s} are ${p}.`:`Some ${s} are not ${p}.`;
  const tname=t=>({A:'Universal affirmative (A)',E:'Universal negative (E)',I:'Particular affirmative (I)',O:'Particular negative (O)'})[t];
  function makeSquareAssertion(kind,s='students',p='readers'){
    if(kind==='contradictory')return {cat:'Assertion reasoning',stem:`${prop('A',s,p)} Therefore ${prop('O',s,p).replace(/^./,c=>c.toLowerCase())}`,choices:[...ASSERTION_CHOICES],answer:'Contradictory error',why:'A and O are contradictories. If the A proposition is true, the O proposition must be false.'};
    if(kind==='contrary')return {cat:'Assertion reasoning',stem:`${prop('A',s,p)} Therefore ${prop('E',s,p).replace(/^./,c=>c.toLowerCase())}`,choices:[...ASSERTION_CHOICES],answer:'Contrary error',why:'A and E are contraries. They cannot both be true, so the conclusion does not follow from the premise.'};
    if(kind==='subcontrary')return {cat:'Assertion reasoning',stem:`${prop('I',s,p)} Therefore ${prop('O',s,p).replace(/^./,c=>c.toLowerCase())}`,choices:[...ASSERTION_CHOICES],answer:'Subcontrary error',why:'I and O are subcontraries. One being true does not force the other to be true.'};
    if(kind==='subalternation')return {cat:'Assertion reasoning',stem:`${prop('I',s,p)} Therefore ${prop('A',s,p).replace(/^./,c=>c.toLowerCase())}`,choices:[...ASSERTION_CHOICES],answer:'Subalternation error',why:'Subalternation does not work upward. A particular proposition does not justify the corresponding universal proposition.'};
    return {cat:'Assertion reasoning',stem:`${prop('A',s,p)} Therefore ${prop('I',s,p).replace(/^./,c=>c.toLowerCase())}`,choices:[...ASSERTION_CHOICES],answer:'No error / valid reasoning',why:'On the traditional square, truth descends by subalternation from A to I.'};
  }
  function makeReasoningAssertion(kind,previousStem){
    const q=questionBank.pick(kind,previousStem);
    return {cat:q.answer,stem:q.stem,choices:ERROR_FILTERS.map(x=>x[1]),answer:q.answer,why:q.why};
  }
  const sqState={correct:0,incorrect:0,streak:0,missed:[],current:null,selected:null};
  const erState={correct:0,incorrect:0,streak:0,missed:[],current:null,selected:null};
  const terms=[['dogs','mammals'],['lawyers','professionals'],['birds','animals'],['students','readers'],['roses','flowers'],['cars','vehicles']];
  const rand=a=>a[Math.floor(Math.random()*a.length)];
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function checked(selector){return [...document.querySelectorAll(selector+':checked')].map(x=>x.value);}
  function selectionError(message){return {error:message};}
  function squareQuestion(){
    const cats=checked('#logicSquareCats input');
    if(!cats.length)return selectionError('Select at least one Square of Opposition study category.');
    const cat=rand(cats),[s,p]=rand(terms),types=['A','E','I','O'];
    if(cat==='identify'){const t=rand(types);return {cat:'Identification',stem:prop(t,s,p),choices:shuffle(types.map(tname)),answer:tname(t),why:`This is the ${t} form: ${prop(t,'S','P')}`};}
    if(cat==='relations'){const pair=rand([['A','O'],['E','I'],['A','E'],['I','O'],['A','I'],['E','O']]);return {cat:'Relationship',stem:`${pair[0]} and ${pair[1]}`,choices:shuffle(['Contradictories','Contraries','Subcontraries','Subalternation']),answer:relationshipBetween(...pair),why:`${pair[0]} and ${pair[1]} are ${relationshipBetween(...pair).toLowerCase()} on the traditional square.`};}
    if(cat==='assertions'){const allowed=checked('#logicAssertionKinds input');if(!allowed.length)return selectionError('Select at least one reasoning assertion type.');return makeSquareAssertion(rand(allowed),s,p);}
    const t=rand(types),ordinary={A:`Every member of the ${s} group is among the ${p}.`,E:`Not one of the ${s} is among the ${p}.`,I:`At least one of the ${s} is among the ${p}.`,O:`At least one of the ${s} is not among the ${p}.`}[t];
    return {cat:'Translation',stem:ordinary,choices:shuffle(types.map(x=>prop(x,s,p))),answer:prop(t,s,p),why:`That statement translates to ${prop(t,s,p)}, the ${t} form.`};
  }
  function errorQuestion(){
    const allowed=checked('#logicErrorCats input');
    if(!allowed.length)return selectionError('Select at least one reasoning-error type.');
    const kind=rand(allowed),previous=erState.current&&erState.current.stem;
    return makeReasoningAssertion(kind,previous);
  }
  function cssEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function renderQuestion(kind,q){
    const pre=kind==='square'?'logicSquare':'logicError',state=kind==='square'?sqState:erState,stem=document.getElementById(pre+'Stem'),feedback=document.getElementById(pre+'Feedback'),box=document.getElementById(pre+'Choices');
    state.selected=null;feedback.innerHTML='';box.innerHTML='';
    if(q&&q.error){state.current=null;stem.innerHTML=`<div class="logicBad"><strong>${cssEscape(q.error)}</strong></div>`;return;}
    state.current=q;stem.innerHTML=cssEscape(q.stem).replace(/\n/g,'<br>');
    shuffle(q.choices).forEach(c=>{const b=document.createElement('button');b.className='logicChoice';b.textContent=c;b.onclick=()=>{if(state.current!==q)return;[...box.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.selected=c;};box.appendChild(b);});
  }
  function check(kind){const pre=kind==='square'?'logicSquare':'logicError',s=kind==='square'?sqState:erState;if(!s.current||!s.selected)return;const ok=s.selected===s.current.answer;if(ok){s.correct++;s.streak++;}else{s.incorrect++;s.streak=0;s.missed.push(s.current);}document.getElementById(pre+'Feedback').innerHTML=`<div class="${ok?'logicGood':'logicBad'}"><strong>${ok?'Correct':'Incorrect'}</strong></div><div><strong>Answer:</strong> ${cssEscape(s.current.answer)}</div><div>${cssEscape(s.current.why)}</div>`;updateStats(kind);}
  function updateStats(kind){const pre=kind==='square'?'logicSquare':'logicError',s=kind==='square'?sqState:erState,total=s.correct+s.incorrect,acc=total?Math.round(100*s.correct/total):0;document.getElementById(pre+'Stats').textContent=`Correct ${s.correct} | Incorrect ${s.incorrect} | ${acc}% | Streak ${s.streak}`;document.getElementById(pre+'Missed').textContent=`Missed to review: ${s.missed.length}`;}
  function review(kind){const s=kind==='square'?sqState:erState;if(s.missed.length)renderQuestion(kind,rand(s.missed));}
  function checkboxes(items){return items.map(([v,l])=>`<label><input type="checkbox" value="${v}" checked> ${l}</label>`).join('');}
  function bulkControls(target){return `<div class="logicBulkActions"><button type="button" data-logic-bulk="${target}" data-logic-check="1">Check all</button><button type="button" data-logic-bulk="${target}" data-logic-check="0">Uncheck all</button></div>`;}
  function logicMarkup(){return `<div class="logicHeader"><div><h2>Logic</h2><div class="sub">Read the statement or argument and pick out the reasoning.</div></div><div class="logicModes"><button class="primary" data-logic-mode="square">Square of Opposition</button><button data-logic-mode="errors">Reasoning Errors</button></div></div><div id="logicModeSquare" class="logicMode"><div class="logicLayout"><section class="card"><h3>Study categories</h3>${bulkControls('#logicModeSquare')}<div id="logicSquareCats" class="logicChecks">${checkboxes([['identify','A / E / I / O identification'],['relations','Square relationships'],['assertions','Reasoning assertions'],['translate','Ordinary-language translation']])}</div><h3>Reasoning assertion types</h3><div class="small" style="margin:-4px 0 8px">These filters apply when Reasoning assertions is selected.</div><div id="logicAssertionKinds" class="logicChecks">${checkboxes(ASSERTION_FILTERS.map(x=>[x.id,x.label]))}</div><div class="logicActions"><button id="logicSquareNew" class="primary">New Statement</button><button id="logicSquareCheck">Check Answer</button><button id="logicSquareReview">Review Missed</button></div></section><section class="card"><div class="small" style="margin-bottom:8px">Read this as something someone is telling you. Pick the reasoning below.</div><div id="logicSquareStem" class="logicStem">Tap New Statement to begin.</div><div id="logicSquareChoices" class="logicChoiceGrid"></div><div id="logicSquareFeedback" class="logicFeedback"></div></section><aside class="card"><h3>Progress</h3><div id="logicSquareStats">Correct 0 | Incorrect 0 | 0% | Streak 0</div><div id="logicSquareMissed" class="small">Missed to review: 0</div><div class="logicSquareRef"><strong>A</strong> All S are P<br><strong>E</strong> No S are P<br><strong>I</strong> Some S are P<br><strong>O</strong> Some S are not P</div></aside></div></div><div id="logicModeErrors" class="logicMode hidden"><div class="logicLayout"><section class="card"><h3>Argument types</h3><div class="small" style="margin:-4px 0 8px">Uncheck any type you do not want to see. "No error" gives you valid arguments too.</div>${bulkControls('#logicErrorCats')}<div id="logicErrorCats" class="logicChecks">${checkboxes(ERROR_FILTERS)}</div><div class="logicActions"><button id="logicErrorNew" class="primary">New Statement</button><button id="logicErrorCheck">Check Answer</button><button id="logicErrorReview">Review Missed</button></div></section><section class="card"><div class="small" style="margin-bottom:8px">No test-style prompt - just read the argument and identify its reasoning.</div><div id="logicErrorStem" class="logicStem">Tap New Statement to begin.</div><div id="logicErrorChoices" class="logicChoiceGrid"></div><div id="logicErrorFeedback" class="logicFeedback"></div></section><aside class="card"><h3>Progress</h3><div id="logicErrorStats">Correct 0 | Incorrect 0 | 0% | Streak 0</div><div id="logicErrorMissed" class="small">Missed to review: 0</div><div class="logicSquareRef"><strong>MP</strong> P -> Q; P; therefore Q<br><strong>MT</strong> P -> Q; not Q; therefore not P<br><strong>AC</strong> P -> Q; Q; therefore P<br><strong>DA</strong> P -> Q; not P; therefore not Q</div></aside></div></div>`;}
  function addNavButton(){document.querySelectorAll('.globalNavBtn[data-tab="greatbooks"], .tab[data-tab="greatbooks"]').forEach(anchor=>{const parent=anchor.parentElement;if(parent.querySelector('[data-tab="logic"]'))return;const b=document.createElement(anchor.tagName==='BUTTON'?'button':'div');b.className=anchor.className;b.dataset.tab='logic';b.textContent='Logic';anchor.insertAdjacentElement('afterend',b);});}
  function showLogic(){document.querySelectorAll('[id^="tab-"]').forEach(x=>x.classList.add('hidden'));const sec=document.getElementById('tab-logic');if(sec)sec.classList.remove('hidden');const menu=document.getElementById('globalMenuPanel');if(menu)menu.style.display='none';}
  function bindNav(){document.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(!t)return;if(t.dataset.tab==='logic'){e.preventDefault();e.stopImmediatePropagation();showLogic();}else{const sec=document.getElementById('tab-logic');if(sec)sec.classList.add('hidden');}},true);}
  function init(){
    if(!document.body||document.getElementById('tab-logic'))return;addNavButton();const ref=document.getElementById('tab-family')||document.querySelector('[id^="tab-"]:last-of-type');if(!ref)return;const sec=document.createElement('div');sec.id='tab-logic';sec.className='hidden';sec.innerHTML=logicMarkup();ref.parentElement.insertBefore(sec,ref);bindNav();
    sec.querySelectorAll('[data-logic-mode]').forEach(b=>b.onclick=()=>{sec.querySelectorAll('[data-logic-mode]').forEach(x=>x.classList.toggle('primary',x===b));document.getElementById('logicModeSquare').classList.toggle('hidden',b.dataset.logicMode!=='square');document.getElementById('logicModeErrors').classList.toggle('hidden',b.dataset.logicMode!=='errors');});
    sec.querySelectorAll('[data-logic-bulk]').forEach(b=>b.onclick=()=>{sec.querySelectorAll(`${b.dataset.logicBulk} input[type="checkbox"]`).forEach(cb=>cb.checked=b.dataset.logicCheck==='1');});
    document.getElementById('logicSquareNew').onclick=()=>renderQuestion('square',squareQuestion());document.getElementById('logicSquareCheck').onclick=()=>check('square');document.getElementById('logicSquareReview').onclick=()=>review('square');document.getElementById('logicErrorNew').onclick=()=>renderQuestion('errors',errorQuestion());document.getElementById('logicErrorCheck').onclick=()=>check('errors');document.getElementById('logicErrorReview').onclick=()=>review('errors');
  }
  return {init,showLogic,relationshipBetween,truthInference,classifyConditionalForm,getAssertionFilterOptions,makeSquareAssertion,makeReasoningAssertion,logicMarkup};
});
