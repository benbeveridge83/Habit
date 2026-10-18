/* LSAT Practice workspace: uses the existing state/save/cloud-sync pipeline. */
(function () {
  'use strict';
  const SOURCE='https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning/logical-reasoning-sample-questions';
  const TESTS='https://www.lsac.org/lsat-disclosed-tests';
  const HUB='https://app.lawhub.org/library';
  const HEADINGS=['Question Type','Argument Structure','Assumptions & Flaws','Answer Choice Analysis','Takeaways'];
  const LETTERS=['A','B','C','D','E'];
  const SAMPLE_META=[
    ['Disagreement: pure research','Point of disagreement','D','The speakers disagree about which contribution of pure research is most valuable.'],
    ['Print and website advertisements','Method of reasoning','D','The executive draws an inference about an unmeasured case from an analogous measured case.'],
    ['Quebec Bridge collapse','Must be true / inference','E','The collapse shows the rules in use did not fully assure safety during construction.'],
    ['Supernova and neutron star','Strengthen','B','Evidence that detection works at greater distances makes an undetected nearby star less likely.'],
    ['Democracy and freedom','Flaw','D','Democracy can promote freedom without being necessary or sufficient for freedom.'],
    ['Drug prices by country','Principle','C','The principle makes individual need, not national average income, relevant to special consideration.'],
    ['Contemporary formal poetry','Sufficient assumption','C','The assumption links politically progressive poets to acts that cannot be politically conservative.'],
    ['Ancient western Asian lake','Necessary assumption','E','The bones must have been deposited before the lake dried up for that date inference to work.'],
    ['Headlights and collision rates','Resolve paradox','C','Drivers who voluntarily use headlights may already be unusually careful.'],
    ['Carpaccio and red pigment','Parallel flaw','D','The argument confuses most A being B with a particular B probably being A.']
  ];
  let filterText='', filterMode='all', editing=false, noteFocus=null, saveDelay=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const uid=()=>typeof cryptoId==='function'?cryptoId():Math.random().toString(36).slice(2)+Date.now();
  function safeNotes(html){
    const tpl=document.createElement('template');tpl.innerHTML=String(html||'');
    const allowed=new Set(['B','STRONG','I','EM','U','P','DIV','BR','OL','UL','LI','BLOCKQUOTE']);
    function clean(node){
      if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.textContent);
      if(node.nodeType!==Node.ELEMENT_NODE)return document.createTextNode('');
      const tag=allowed.has(node.tagName)?node.tagName:'SPAN';
      const el=document.createElement(tag);
      for(const child of [...node.childNodes])el.appendChild(clean(child));
      return el;
    }
    const div=document.createElement('div');
    [...tpl.content.childNodes].forEach(x=>div.appendChild(clean(x)));
    return div.innerHTML;
  }
  function getStore(){
    if(typeof state==='undefined')throw Error('App data unavailable');
    if(!state.lsat||typeof state.lsat!=='object'){
      state.lsat={headings:[...HEADINGS],problems:SAMPLE_META.map((a,i)=>({
        id:'lsac-sample-'+(i+1),title:'Official sample '+(i+1)+': '+a[0],origin:'LSAC sample questions',
        stem:'',choices:['','','','',''],answer:a[2],explanation:a[3],
        sourceUrl:SOURCE,sourceNumber:i+1,topic:a[1],selected:'',checked:false,
        categories:[[],[],[],[],[]],notes:'',attempts:0,correctAttempts:0
      })),currentId:'lsac-sample-1'};
      save();
    }
    const s=state.lsat;
    if(!Array.isArray(s.headings))s.headings=[...HEADINGS];
    while(s.headings.length<5)s.headings.push(HEADINGS[s.headings.length]);
    s.headings=s.headings.slice(0,5);
    if(!Array.isArray(s.problems))s.problems=[];
    for(const q of s.problems){
      if(!Array.isArray(q.categories))q.categories=[[],[],[],[],[]];
      while(q.categories.length<5)q.categories.push([]);
      q.categories=q.categories.slice(0,5);
      if(!Array.isArray(q.choices))q.choices=['','','','',''];
      while(q.choices.length<5)q.choices.push('');
    }
    return s;
  }
  const getProblem=()=>{const s=getStore();return s.problems.find(q=>q.id===s.currentId)||s.problems[0]||null;};
  function persist(){clearTimeout(saveDelay);saveDelay=setTimeout(()=>{try{save();}catch(e){console.error(e);}},300);}
  function persistNow(){clearTimeout(saveDelay);save();}
  function newProblem(){
    return {id:uid(),title:'New LSAT problem',origin:'My questions',stem:'',choices:['','','','',''],answer:'',
      explanation:'',sourceUrl:'',sourceNumber:null,topic:'',selected:'',checked:false,
      categories:[[],[],[],[],[]],notes:'',attempts:0,correctAttempts:0};
  }
  function toolbar(){
    return '<div class="lsat-toolbar" role="toolbar" aria-label="Text formatting">'+
    [['bold','B','Bold'],['italic','I','Italic'],['underline','U','Underline'],['insertUnorderedList','•','Bullets'],
     ['insertOrderedList','1.','Numbered list'],['indent','→','Indent'],['outdent','←','Outdent']].map(([cmd,label,title])=>
     '<button type="button" data-lsat-format="'+cmd+'" title="'+title+'" aria-label="'+title+'">'+label+'</button>').join('')+'</div>';
  }
  function editor(html,type,cat,sub,cls=''){
    let attr='data-lsat-editor="'+type+'"';
    if(cat!==null&&cat!==undefined)attr+=' data-cat="'+cat+'"';
    if(sub)attr+=' data-sub="'+esc(sub)+'"';
    return toolbar()+'<div class="lsat-editor '+cls+'" '+attr+' contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Write your notes here...">'+safeNotes(html)+'</div>';
  }
  function listHTML(){
    const s=getStore();
    const items=s.problems.filter(q=>{
      const matches=(q.title+' '+(q.topic||'')+' '+(q.stem||'')).toLowerCase().includes(filterText.toLowerCase());
      const status=filterMode==='all'||(filterMode==='unanswered'?!q.checked:filterMode==='missed'?q.checked&&q.selected!==q.answer:q.checked&&q.selected===q.answer);
      return matches&&status;
    });
    const attempts=s.problems.filter(q=>q.checked&&q.answer), correct=attempts.filter(q=>q.selected===q.answer);
    document.getElementById('lsatStats').textContent=s.problems.length+' questions · '+attempts.length+' checked · '+correct.length+' correct ('+(attempts.length?Math.round(correct.length/attempts.length*100):0)+'%)';
    document.getElementById('lsatList').innerHTML=items.length?items.map(q=>
      '<button class="lsat-question-item '+(q.id===s.currentId?'active':'')+'" data-lsat-select="'+esc(q.id)+'"><strong>'+esc(q.title)+'</strong><small>'+
      esc(q.topic||q.origin||'Uncategorized')+' · '+(q.checked?(q.selected===q.answer?'✓ Correct':'✕ Review'):'Not checked')+'</small></button>').join(''):
      '<div class="lsat-empty">No matching questions.</div>';
  }
  function renderQuestion(){
    const s=getStore(),q=getProblem(),wrap=document.getElementById('lsatMain');
    if(!q){wrap.innerHTML='<div class="lsat-empty">Choose Add New Problem to begin.</div>';return;}
    const official=!!q.sourceUrl, haveChoices=q.choices.some(v=>String(v||'').trim());
    const questionLabel=q.stem?'':official?'Official question text is on the LSAC page. Open the source below, read Question '+esc(q.sourceNumber||'')+', then select your answer here.':'Enter the question text using Edit Problem.';
    const choices=LETTERS.map((c,i)=>'<button type="button" class="lsat-choice '+(q.selected===c?'selected':'')+'" data-lsat-choice="'+c+'" aria-pressed="'+(q.selected===c)+'"><span class="lsat-letter">'+c+'</span><span>'+esc(q.choices[i]||'Answer '+c+(official?' (see original question)':''))+'</span></button>').join('');
    const checked=q.checked&&q.answer?'<div class="lsat-feedback '+(q.selected===q.answer?'good':'bad')+'"><strong>'+
      (q.selected===q.answer?'Correct.':'Incorrect.')+'</strong> Correct answer: <strong>'+esc(q.answer)+'</strong>'+
      (q.explanation?'<div style="margin-top:7px">'+esc(q.explanation)+'</div>':'')+
      (official?'<div class="lsat-muted" style="margin-top:6px">Read the full official explanation at the source link.</div>':'')+'</div>':
      q.checked?'<div class="lsat-feedback">No answer key has been entered for this problem yet.</div>':'';
    wrap.innerHTML='<div class="lsat-topline"><div><div class="lsat-row"><span class="lsat-tag">'+esc(q.origin||'My questions')+'</span><span class="lsat-tag">'+esc(q.topic||'Uncategorized')+'</span></div><h2 style="margin:8px 0 3px">'+esc(q.title)+'</h2></div>'+
      '<div class="lsat-row"><button data-lsat-action="edit">Edit Problem</button><button data-lsat-action="delete" class="danger">Delete</button></div></div>'+
      (editing?editMarkup(q):'<div class="lsat-stem">'+esc(q.stem||questionLabel)+'</div>'+
      (official?'<div class="lsat-links"><strong>Official LSAT source:</strong> <a class="lsat-link" href="'+esc(q.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Open LSAC Question '+esc(q.sourceNumber||'')+' and explanation ↗</a></div>':'')+
      '<div class="lsat-choices">'+choices+'</div><div class="lsat-row"><button class="primary" data-lsat-action="check" '+(!q.selected?'disabled':'')+'>Check Answer</button>'+
      '<button data-lsat-action="reset">Try Again</button><span class="lsat-muted">Your answer stays hidden until you check it.</span></div>'+checked)+
      '<h3 class="lsat-section-title">Categorize &amp; analyze this problem</h3><p class="lsat-muted">Rename any of the five headings. Add as many subheadings and rich-text notes as you like under each.</p>'+
      s.headings.map((h,i)=>'<div class="lsat-cat"><div class="lsat-cathead"><label style="flex:1;min-width:180px"><span class="lsat-muted">Heading '+(i+1)+'</span><input aria-label="Heading '+(i+1)+'" data-lsat-heading="'+i+'" value="'+esc(h)+'"></label>'+
      '<button data-lsat-add-sub="'+i+'">+ Subheading</button></div>'+
      (q.categories[i]||[]).map(sub=>'<div class="lsat-subnote"><div class="lsat-row"><input aria-label="Subheading name" style="flex:1;min-width:150px" data-lsat-subtitle="'+esc(sub.id)+'" data-cat="'+i+'" value="'+esc(sub.title)+'"><button data-lsat-remove-sub="'+esc(sub.id)+'" data-cat="'+i+'" title="Remove this subheading">Remove</button></div>'+
      editor(sub.notes||'','sub',i,sub.id)+'</div>').join('')+
      '</div>').join('')+
      '<h3 class="lsat-section-title">General problem notes</h3>'+editor(q.notes||'','general',null,null,'lsat-general');
    noteFocus=null;
  }
  function editMarkup(q){
    return '<div class="lsat-form"><label>Problem title<input data-lsat-field="title" value="'+esc(q.title)+'"></label>'+
    '<label>Question category / type<input data-lsat-field="topic" value="'+esc(q.topic||'')+'"></label>'+
    '<label>Problem text / question stem<textarea data-lsat-field="stem">'+esc(q.stem||'')+'</textarea></label>'+
    '<div class="lsat-optionfields">'+LETTERS.map((l,i)=>'<label><b>'+l+'</b><input data-lsat-option="'+i+'" placeholder="Answer '+l+'" value="'+esc(q.choices[i]||'')+'"></label>').join('')+'</div>'+
    '<label>Correct answer <select data-lsat-field="answer"><option value="">Not known yet</option>'+
    LETTERS.map(l=>'<option value="'+l+'" '+(q.answer===l?'selected':'')+'>'+l+'</option>').join('')+'</select></label>'+
    '<label>Answer explanation<textarea data-lsat-field="explanation" placeholder="Why the right answer is correct and why the others are not.">'+esc(q.explanation||'')+'</textarea></label>'+
    '<label>Source URL (optional)<input data-lsat-field="sourceUrl" value="'+esc(q.sourceUrl||'')+'"></label>'+
    '<div class="lsat-row"><button class="primary" data-lsat-action="done-edit">Done Editing</button></div></div>';
  }
  function render(){listHTML();renderQuestion();}
  function show(){
    document.querySelectorAll('[id^="tab-"]').forEach(x=>x.classList.add('hidden'));
    document.getElementById('tab-lsat').classList.remove('hidden');
    document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab==='lsat'));
    const label=document.getElementById('currentSectionLabel');if(label)label.textContent='LSAT Practice';
    for(const id of ['globalMenuPanel','menuPanel','tabs']){const el=document.getElementById(id);if(el)el.style.display='none';}
    if(typeof state!=='undefined'){state.ui=state.ui||{};state.ui.activeTab='lsat';}
    persistNow();render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function add(){
    const s=getStore(),q=newProblem();s.problems.unshift(q);s.currentId=q.id;editing=true;persistNow();render();
  }
  function changeAnswer(letter){
    const q=getProblem();if(!q)return;q.selected=letter;q.checked=false;persistNow();renderQuestion();
  }
  function check(){
    const q=getProblem();if(!q||!q.selected)return;
    if(!q.checked){q.attempts=(Number(q.attempts)||0)+1;if(q.answer===q.selected)q.correctAttempts=(Number(q.correctAttempts)||0)+1;}
    q.checked=true;persistNow();render();
  }
  function normalizeUrl(url){try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch(e){return '';}}
  function importFile(file){
    if(!file||file.size>5*1024*1024){alert('Choose a JSON file under 5 MB.');return;}
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed=JSON.parse(reader.result);
        const entries=Array.isArray(parsed)?parsed:Array.isArray(parsed.problems)?parsed.problems:null;
        if(!entries||entries.length>1000||!entries.length)throw Error('Expected an array of 1 to 1000 questions.');
        const s=getStore();
        const sanitized=entries.map(p=>{
          if(!p||typeof p!=='object'||typeof p.title!=='string')throw Error('Every question needs a title.');
          const q=newProblem();q.title=p.title.slice(0,300);q.topic=String(p.topic||'').slice(0,180);
          q.stem=String(p.stem||p.question||'').slice(0,12000);
          const choices=Array.isArray(p.choices)?p.choices:[p.A,p.B,p.C,p.D,p.E];
          q.choices=LETTERS.map((_,i)=>String(choices?.[i]||'').slice(0,6000));
          q.answer=LETTERS.includes(String(p.answer||'').toUpperCase())?String(p.answer).toUpperCase():'';
          q.explanation=String(p.explanation||'').slice(0,12000);
          q.sourceUrl=normalizeUrl(p.sourceUrl||'');q.origin=String(p.origin||'Imported questions').slice(0,100);
          q.notes=safeNotes(p.notes||'').slice(0,30000);
          if(Array.isArray(p.categories))q.categories=Array.from({length:5},(_,i)=>Array.isArray(p.categories[i])?
            p.categories[i].slice(0,40).map(v=>({id:uid(),title:String(v.title||'Subheading').slice(0,160),notes:safeNotes(v.notes||'').slice(0,30000)})):[]);
          return q;
        });
        s.problems.push(...sanitized);s.currentId=sanitized[0].id;editing=false;persistNow();render();
        alert('Imported '+sanitized.length+' problem(s).');
      }catch(e){alert('Could not import: '+e.message);}
      document.getElementById('lsatImportFile').value='';
    };
    reader.readAsText(file);
  }
  function exportFile(){
    const s=getStore(),data=JSON.stringify({headings:s.headings,problems:s.problems},null,2);
    const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='habit-lsat-problems-'+new Date().toISOString().slice(0,10)+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function clickAction(action){
    const s=getStore(),q=getProblem();
    if(action==='new')return add();
    if(action==='import')return document.getElementById('lsatImportFile').click();
    if(action==='export')return exportFile();
    if(action==='edit'){editing=true;renderQuestion();return;}
    if(action==='done-edit'){editing=false;persistNow();render();return;}
    if(action==='check')return check();
    if(action==='reset'){q.selected='';q.checked=false;persistNow();render();return;}
    if(action==='delete'){
      if(!confirm('Delete this LSAT problem and all of its notes?'))return;
      s.problems=s.problems.filter(p=>p.id!==q.id);s.currentId=s.problems[0]?.id||'';editing=false;persistNow();render();
    }
  }
  function handleInput(e){
    const t=e.target,q=getProblem(),s=getStore();if(!q)return;
    if(t.hasAttribute('data-lsat-heading')){s.headings[Number(t.dataset.lsatHeading)]=t.value;persist();return;}
    if(t.hasAttribute('data-lsat-field')){
      const f=t.dataset.lsatField;q[f]=f==='sourceUrl'?normalizeUrl(t.value)||t.value:t.value;
      if(f==='answer')q.checked=false;
      persist();return;
    }
    if(t.hasAttribute('data-lsat-option')){q.choices[Number(t.dataset.lsatOption)]=t.value;persist();return;}
    if(t.hasAttribute('data-lsat-subtitle')){
      const sub=q.categories[Number(t.dataset.cat)]?.find(x=>x.id===t.dataset.lsatSubtitle);
      if(sub)sub.title=t.value;persist();return;
    }
    if(t.hasAttribute('data-lsat-editor')){
      if(t.dataset.lsatEditor==='general')q.notes=safeNotes(t.innerHTML);
      else {const sub=q.categories[Number(t.dataset.cat)]?.find(x=>x.id===t.dataset.sub);if(sub)sub.notes=safeNotes(t.innerHTML);}
      persist();
    }
  }
  function handleClicks(e){
    const t=e.target.closest('[data-lsat-action],[data-lsat-select],[data-lsat-choice],[data-lsat-add-sub],[data-lsat-remove-sub],[data-lsat-format]');
    if(!t)return;
    if(t.hasAttribute('data-lsat-action'))return clickAction(t.dataset.lsatAction);
    if(t.hasAttribute('data-lsat-select')){getStore().currentId=t.dataset.lsatSelect;editing=false;persistNow();render();return;}
    if(t.hasAttribute('data-lsat-choice'))return changeAnswer(t.dataset.lsatChoice);
    if(t.hasAttribute('data-lsat-add-sub')){
      const i=Number(t.dataset.lsatAddSub),title=prompt('New subheading name:','My analysis');
      if(!title||!title.trim())return;
      getProblem().categories[i].push({id:uid(),title:title.trim(),notes:''});
      persistNow();renderQuestion();return;
    }
    if(t.hasAttribute('data-lsat-remove-sub')){
      if(!confirm('Delete this subheading and its notes?'))return;
      const q=getProblem(),i=Number(t.dataset.cat);q.categories[i]=q.categories[i].filter(x=>x.id!==t.dataset.lsatRemoveSub);
      persistNow();renderQuestion();return;
    }
    if(t.hasAttribute('data-lsat-format')){
      e.preventDefault();
      const editor=noteFocus&&document.contains(noteFocus)?noteFocus:document.activeElement.closest?.('.lsat-editor');
      if(!editor)return;
      editor.focus();
      if(savedRange){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);}
      document.execCommand(t.dataset.lsatFormat,false,null);
      editor.dispatchEvent(new Event('input',{bubbles:true}));return;
    }
  }
  let savedRange=null;
  function init(){
    if(!document.body||document.getElementById('tab-lsat'))return;
    document.querySelectorAll('.globalNavBtn[data-tab="greatbooks"],.tab[data-tab="greatbooks"]').forEach(anchor=>{
      if(anchor.parentElement.querySelector('[data-tab="lsat"]'))return;
      const el=document.createElement(anchor.tagName==='BUTTON'?'button':'div');
      el.className=anchor.className;el.dataset.tab='lsat';el.textContent='LSAT Practice';
      anchor.insertAdjacentElement('afterend',el);
    });
    const ref=document.getElementById('tab-family');
    if(!ref)return;
    const sec=document.createElement('div');sec.id='tab-lsat';sec.className='hidden';
    sec.innerHTML='<div class="lsat-head"><div><h2>LSAT Logical Reasoning</h2>'+
      '<p class="sub">Solve questions, reveal the verified answer, and organize detailed notes under five customizable headings.</p></div>'+
      '<div class="lsat-actions"><button class="primary" data-lsat-action="new">+ Add New Problem</button>'+
      '<button data-lsat-action="import">Import JSON</button><button data-lsat-action="export">Export Notes</button>'+
      '<input type="file" id="lsatImportFile" accept=".json,application/json" hidden></div></div>'+
      '<div class="lsat-links" style="margin-bottom:14px"><strong>Official questions:</strong> Ten LSAC sample questions are indexed below with verified answer keys. '+
      'Their copyrighted question text and full explanations remain on <a class="lsat-link" href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">LSAC</a>. '+
      'More official tests: <a class="lsat-link" href="'+TESTS+'" target="_blank" rel="noopener noreferrer">disclosed exams</a> · '+
      '<a class="lsat-link" href="'+HUB+'" target="_blank" rel="noopener noreferrer">LawHub</a>. '+
      'You can also enter a problem or bulk-import questions in JSON.</div>'+
      '<div class="lsat-layout"><aside class="lsat-panel lsat-side"><h3 style="margin-top:0">Problem Library</h3>'+
      '<div id="lsatStats" class="lsat-stat"></div><input id="lsatSearch" placeholder="Search problems..." aria-label="Search LSAT problems" style="width:100%;margin-bottom:8px">'+
      '<select id="lsatFilter" aria-label="Filter LSAT problems" style="width:100%;margin-bottom:10px"><option value="all">All problems</option>'+
      '<option value="unanswered">Not checked</option><option value="missed">Missed</option><option value="correct">Correct</option></select>'+
      '<div id="lsatList" class="lsat-list"></div></aside>'+
      '<section class="lsat-panel" id="lsatMain" aria-live="polite"></section></div>';
    ref.parentElement.insertBefore(sec,ref);
    sec.addEventListener('click',handleClicks);
    sec.addEventListener('input',handleInput);
    sec.addEventListener('change',e=>{if(e.target.id==='lsatImportFile')importFile(e.target.files?.[0]);else handleInput(e);});
    sec.addEventListener('focusin',e=>{if(e.target.classList?.contains('lsat-editor'))noteFocus=e.target;});
    sec.addEventListener('keyup',e=>{if(e.target.classList?.contains('lsat-editor')){const sel=window.getSelection();if(sel.rangeCount)savedRange=sel.getRangeAt(0).cloneRange();}});
    sec.addEventListener('mouseup',e=>{if(e.target.closest('.lsat-editor')){const sel=window.getSelection();if(sel.rangeCount)savedRange=sel.getRangeAt(0).cloneRange();}});
    sec.addEventListener('pointerdown',e=>{if(e.target.closest('[data-lsat-format]'))e.preventDefault();});
    sec.querySelector('#lsatSearch').addEventListener('input',e=>{filterText=e.target.value;listHTML();});
    sec.querySelector('#lsatFilter').addEventListener('change',e=>{filterMode=e.target.value;listHTML();});
    document.addEventListener('click',e=>{
      const nav=e.target.closest('[data-tab]');
      if(!nav)return;
      if(nav.dataset.tab==='lsat'){e.preventDefault();e.stopImmediatePropagation();show();}
      else sec.classList.add('hidden');
    },true);
    // Keep LSAT state in the same JSON used by the app's device + Supabase cloud sync.
    getStore();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();