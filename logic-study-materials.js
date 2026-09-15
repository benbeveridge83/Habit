(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root){
    root.HabitLogicStudyMaterials=api;
    if(root.document) api.init(root.document);
  }
})(typeof window!=='undefined'?window:globalThis,function(){
  const MATERIALS={
    logicSquareCats:{
      identify:{
        title:'A / E / I / O identification',
        html:`<p><strong>Quantity</strong> tells you whether the statement is universal or particular. <strong>Quality</strong> tells you whether it is affirmative or negative.</p>
          <ul>
            <li><strong>A — Universal affirmative:</strong> All S are P.</li>
            <li><strong>E — Universal negative:</strong> No S are P.</li>
            <li><strong>I — Particular affirmative:</strong> Some S are P.</li>
            <li><strong>O — Particular negative:</strong> Some S are not P.</li>
          </ul>
          <p><strong>Memory pattern:</strong> A = All; E = Exclusion/none; I = some are; O = some are not.</p>`
      },
      relations:{
        title:'Square relationships',
        html:`<p>On the <strong>traditional Aristotelian square</strong>, the four categorical forms are connected by four relationships:</p>
          <ul>
            <li><strong>A–O</strong> and <strong>E–I — Contradictories:</strong> exactly one is true and the other is false.</li>
            <li><strong>A–E — Contraries:</strong> they cannot both be true, but they can both be false.</li>
            <li><strong>I–O — Subcontraries:</strong> they cannot both be false, but they can both be true.</li>
            <li><strong>A–I</strong> and <strong>E–O — Subalternation:</strong> truth moves downward from universal to particular; falsity moves upward from particular to universal.</li>
          </ul>
          <p><strong>Quick rule:</strong> contradictions give a definite opposite truth value. Contraries and subcontraries give only one-way inferences. Subalternation works downward for truth and upward for falsity.</p>`
      },
      assertions:{
        title:'Reasoning with square relationships',
        html:`<p>When one categorical proposition is used to infer another, first identify both letter forms and then identify their relationship.</p>
          <ol>
            <li>Translate each statement into A, E, I, or O.</li>
            <li>Find the relationship between the two forms.</li>
            <li>Ask whether the premise's truth or falsity actually determines the conclusion.</li>
          </ol>
          <p>A common error is treating a relationship as stronger than it is—for example, assuming that because two propositions are contraries, if one is false the other must be true.</p>`
      },
      translate:{
        title:'Ordinary-language translation',
        html:`<p>Reduce ordinary wording to the categorical core <strong>S–P</strong>.</p>
          <ul>
            <li>Words such as <strong>all, every, each</strong> usually signal A.</li>
            <li>Words such as <strong>no, none, not one</strong> usually signal E.</li>
            <li>Words such as <strong>some, at least one</strong> with an affirmative predicate signal I.</li>
            <li><strong>Some ... not</strong> or <strong>at least one ... is not</strong> signals O.</li>
          </ul>
          <p>Ignore decorative wording and ask: is the claim universal or particular, and is it affirmative or negative?</p>`
      }
    },
    logicAssertionKinds:{
      contradictory:{
        title:'Contradictory inference',
        html:`<p><strong>Pairs:</strong> A–O and E–I.</p><ul><li>If one is true, the other must be false.</li><li>If one is false, the other must be true.</li></ul><p>This is the strongest square relationship because the two propositions always have opposite truth values.</p>`
      },
      contrary:{
        title:'Contrary inference',
        html:`<p><strong>Pair:</strong> A–E.</p><ul><li>If A is true, E is false.</li><li>If E is true, A is false.</li><li>If either is false, the other is <strong>undetermined</strong>.</li></ul><p>The error is assuming that falsity of one contrary proves truth of the other.</p>`
      },
      subcontrary:{
        title:'Subcontrary inference',
        html:`<p><strong>Pair:</strong> I–O.</p><ul><li>If I is false, O is true.</li><li>If O is false, I is true.</li><li>If either is true, the other is <strong>undetermined</strong>.</li></ul><p>The error is assuming that truth of one subcontrary proves truth or falsity of the other.</p>`
      },
      subalternation:{
        title:'Subalternation inference',
        html:`<p><strong>Pairs:</strong> A→I and E→O on the traditional square.</p><ul><li>Truth descends: A true ⇒ I true; E true ⇒ O true.</li><li>Falsity ascends: I false ⇒ A false; O false ⇒ E false.</li><li>Truth does not ascend, and falsity does not descend.</li></ul><p>So “Some S are P” does not justify “All S are P.”</p>`
      },
      noerror:{
        title:'Valid square inference',
        html:`<p>A square inference is valid when it follows one of the licensed truth/falsity movements on the traditional square.</p><ul><li>Contradictories: either truth value determines the opposite proposition.</li><li>Contraries: truth determines falsity across A–E.</li><li>Subcontraries: falsity determines truth across I–O.</li><li>Subalternation: truth descends; falsity ascends.</li></ul>`
      }
    },
    logicErrorCats:{
      mp:{
        title:'Modus Ponens',
        html:`<p><strong>Valid conditional form.</strong></p><p class="logicStudyForm">P → Q<br>P<br>∴ Q</p><p>If the conditional is true and its antecedent P is true, the consequent Q follows.</p><p><strong>Example:</strong> If a figure is a square, it has four sides. This figure is a square. Therefore it has four sides.</p>`
      },
      mt:{
        title:'Modus Tollens',
        html:`<p><strong>Valid conditional form.</strong></p><p class="logicStudyForm">P → Q<br>¬Q<br>∴ ¬P</p><p>If P would guarantee Q, then discovering that Q is false rules out P.</p><p><strong>Example:</strong> If a figure is a square, it has four sides. This figure does not have four sides. Therefore it is not a square.</p>`
      },
      ac:{
        title:'Affirming the Consequent',
        html:`<p><strong>Invalid conditional form.</strong></p><p class="logicStudyForm">P → Q<br>Q<br>∴ P</p><p>Q may be true for some reason other than P. The conditional says P is sufficient for Q; it does not say P is necessary for Q.</p><p><strong>Example:</strong> If it rains, the street gets wet. The street is wet. Therefore it rained. The street could have been sprayed by a sprinkler.</p>`
      },
      da:{
        title:'Denying the Antecedent',
        html:`<p><strong>Invalid conditional form.</strong></p><p class="logicStudyForm">P → Q<br>¬P<br>∴ ¬Q</p><p>The fact that one sufficient condition is absent does not show that Q is false; Q may have another cause.</p><p><strong>Example:</strong> If a shape is a square, it has four sides. It is not a square. Therefore it does not have four sides. A rectangle shows why that fails.</p>`
      },
      um:{
        title:'Undistributed Middle',
        html:`<p><strong>Invalid categorical syllogism.</strong> The middle term appears in both premises but is never distributed, so the premises never establish that the two end groups overlap in the needed way.</p><p class="logicStudyForm">All A are M.<br>All B are M.<br>∴ All B are A.</p><p><strong>Example:</strong> All cats are animals. All dogs are animals. Therefore all dogs are cats.</p>`
      },
      ilmj:{
        title:'Illicit Major',
        html:`<p><strong>Invalid categorical syllogism.</strong> The major term is distributed in the conclusion even though it was not distributed in the major premise.</p><p>The conclusion makes a claim about the whole major-term class that the premise did not license.</p><p><strong>Example:</strong> All dogs are mammals. No cats are dogs. Therefore no cats are mammals.</p>`
      },
      ilmn:{
        title:'Illicit Minor',
        html:`<p><strong>Invalid categorical syllogism.</strong> The minor term is distributed in the conclusion even though it was not distributed in the minor premise.</p><p>The conclusion says more about the entire minor-term class than the premises established.</p><p><strong>Example:</strong> All poets are writers. All poets are dreamers. Therefore all dreamers are writers.</p>`
      },
      four:{
        title:'Four-Term Fallacy',
        html:`<p><strong>Invalid categorical syllogism.</strong> A valid categorical syllogism needs exactly three terms. If a word changes meaning between premises, it functions as two different terms and creates a hidden fourth term.</p><p><strong>Example:</strong> All banks keep money safe. River banks are banks. Therefore river banks keep money safe. “Bank” changes meaning.</p>`
      },
      noerror:{
        title:'No error / valid reasoning',
        html:`<p>Not every argument is a fallacy. A valid argument has a form in which, if the premises are true, the conclusion cannot be false.</p><ul><li>Modus Ponens and Modus Tollens are valid conditional forms.</li><li>Properly distributed categorical syllogisms can also be valid.</li><li>Validity concerns the connection between premises and conclusion; it does not by itself prove that the premises are factually true.</li></ul>`
      }
    }
  };

  const GROUPS=[
    {id:'logicSquareCats',mode:'square',label:'Square study categories'},
    {id:'logicAssertionKinds',mode:'square',label:'Reasoning assertion types'},
    {id:'logicErrorCats',mode:'errors',label:'Argument types'}
  ];

  function getStudyMaterial(groupId,value){
    const item=MATERIALS[groupId]&&MATERIALS[groupId][value];
    return item ? {...item} : null;
  }

  function getGroupConfigs(){
    return GROUPS.map(x=>({...x}));
  }

  function renderStudyHtml(selections){
    const cards=(selections||[]).map(sel=>{
      const material=getStudyMaterial(sel.groupId,sel.value);
      if(!material) return '';
      return `<article class="logicStudyNote" data-study-group="${sel.groupId}" data-study-value="${sel.value}"><h4>${material.title}</h4>${material.html}</article>`;
    }).filter(Boolean);
    return cards.join('');
  }

  function dispatchChange(doc,input){
    if(!input||typeof input.dispatchEvent!=='function') return;
    const View=doc&&doc.defaultView;
    const EventCtor=View&&View.Event ? View.Event : (typeof Event!=='undefined'?Event:null);
    if(EventCtor) input.dispatchEvent(new EventCtor('change',{bubbles:true}));
  }

  function addStudyBulkControls(doc,group,list){
    const existing=doc.querySelector(`[data-logic-filter-controls="${group.id}"]`);
    if(existing){
      const buttons=existing.querySelectorAll('button');
      if(buttons[0]) buttons[0].textContent='Quiz: Select All';
      if(buttons[1]) buttons[1].textContent='Quiz: Select None';
    }
    const wrap=doc.createElement('div');
    wrap.className='logicFilterControls logicStudyFilterControls';
    wrap.dataset.logicStudyBulk=group.id;
    const all=doc.createElement('button');
    all.type='button';all.className='logicFilterBtn';all.textContent='Study: Select All';
    const none=doc.createElement('button');
    none.type='button';none.className='logicFilterBtn';none.textContent='Study: Select None';
    const setAll=checked=>{
      list.querySelectorAll('input[data-logic-role="study"]').forEach(input=>input.checked=checked);
      renderModeStudy(doc,group.mode);
    };
    all.addEventListener('click',()=>setAll(true));
    none.addEventListener('click',()=>setAll(false));
    wrap.append(all,none);
    list.parentNode.insertBefore(wrap,list);
  }

  function enhanceGroup(doc,group){
    const source=doc.getElementById(group.id);
    if(!source||source.dataset.logicStudyEnhanced==='1') return false;
    const labels=[...source.querySelectorAll('label')];
    if(!labels.length) return false;
    source.dataset.logicStudyEnhanced='1';
    source.classList.add('logicQuizSource');

    const list=doc.createElement('div');
    list.className='logicDualChecks';
    list.dataset.logicDualGroup=group.id;
    const header=doc.createElement('div');
    header.className='logicDualHeader';
    header.innerHTML='<span>Topic</span><span>Quiz</span><span>Study</span>';
    list.appendChild(header);

    labels.forEach(label=>{
      const real=label.querySelector('input[type="checkbox"]');
      if(!real) return;
      const value=real.value;
      const title=label.textContent.trim();
      const row=doc.createElement('div');
      row.className='logicDualRow';
      row.dataset.logicValue=value;

      const name=doc.createElement('span');
      name.className='logicDualTopic';
      name.textContent=title;

      const quizLabel=doc.createElement('label');
      quizLabel.className='logicMiniCheck';
      const quiz=doc.createElement('input');
      quiz.type='checkbox';quiz.checked=real.checked;quiz.dataset.logicRole='quiz';quiz.setAttribute('aria-label',`Quiz: ${title}`);
      quizLabel.appendChild(quiz);

      const studyLabel=doc.createElement('label');
      studyLabel.className='logicMiniCheck';
      const study=doc.createElement('input');
      study.type='checkbox';study.dataset.logicRole='study';study.dataset.logicStudyGroup=group.id;study.value=value;study.setAttribute('aria-label',`Study: ${title}`);
      studyLabel.appendChild(study);

      quiz.addEventListener('change',()=>{
        real.checked=quiz.checked;
        dispatchChange(doc,real);
      });
      real.addEventListener('change',()=>{quiz.checked=real.checked;});
      study.addEventListener('change',()=>renderModeStudy(doc,group.mode));

      row.append(name,quizLabel,studyLabel);
      list.appendChild(row);
    });

    source.insertAdjacentElement('afterend',list);
    addStudyBulkControls(doc,group,list);
    return true;
  }

  function ensurePanel(doc,mode){
    const modeEl=doc.getElementById(mode==='square'?'logicModeSquare':'logicModeErrors');
    if(!modeEl) return null;
    let panel=modeEl.querySelector(`[data-logic-study-panel="${mode}"]`);
    if(panel) return panel;
    panel=doc.createElement('section');
    panel.className='card logicStudyPanel';
    panel.dataset.logicStudyPanel=mode;
    panel.innerHTML='<div class="logicStudyPanelHeader"><div><h3>Study Material</h3><div class="small">Check Study beside any topic above to build your outline.</div></div></div><div class="logicStudyOutline"><div class="logicStudyEmpty">No study topics selected yet.</div></div>';
    modeEl.appendChild(panel);
    return panel;
  }

  function selectedForMode(doc,mode){
    const groups=GROUPS.filter(x=>x.mode===mode);
    const selections=[];
    groups.forEach(group=>{
      const list=doc.querySelector(`[data-logic-dual-group="${group.id}"]`);
      if(!list) return;
      list.querySelectorAll('input[data-logic-role="study"]:checked').forEach(input=>selections.push({groupId:group.id,value:input.value}));
    });
    return selections;
  }

  function renderModeStudy(doc,mode){
    const panel=ensurePanel(doc,mode);
    if(!panel) return '';
    const selections=selectedForMode(doc,mode);
    const html=renderStudyHtml(selections);
    const outline=panel.querySelector('.logicStudyOutline');
    if(outline) outline.innerHTML=html||'<div class="logicStudyEmpty">No study topics selected yet.</div>';
    return html;
  }

  function hideLegacyBulk(doc){
    doc.querySelectorAll('#tab-logic .logicBulkActions').forEach(el=>el.classList.add('logicLegacyBulkHidden'));
  }

  function mount(doc){
    let changed=false;
    GROUPS.forEach(group=>{if(enhanceGroup(doc,group)) changed=true;});
    hideLegacyBulk(doc);
    if(doc.getElementById('logicModeSquare')) renderModeStudy(doc,'square');
    if(doc.getElementById('logicModeErrors')) renderModeStudy(doc,'errors');
    return changed;
  }

  function init(doc){
    if(!doc) return;
    mount(doc);
    const View=doc.defaultView;
    const Observer=View&&View.MutationObserver ? View.MutationObserver : (typeof MutationObserver!=='undefined'?MutationObserver:null);
    if(Observer&&doc.documentElement){
      const observer=new Observer(()=>mount(doc));
      observer.observe(doc.documentElement,{childList:true,subtree:true});
    }
  }

  return {getStudyMaterial,getGroupConfigs,renderStudyHtml,selectedForMode,renderModeStudy,enhanceGroup,mount,init};
});
