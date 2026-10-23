/* Per-question LSAT Breakdown panel. It never edits the original prompt or answer choices. */
(function () {
  'use strict';
  const core = window.HabitLSATBreakdownCore;
  if (!core) return;
  const ROLES = [['unassigned', 'Unassigned'], ['major-premise', 'Major premise'], ['minor-premise', 'Minor premise'], ['conclusion', 'Conclusion'], ['other', 'Other / fluff']];
  const COLORS = [['minor','Minor term · S'],['middle','Middle term · M'],['major','Major term · P']];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let active = 'question';
  let lastQuestion = null;
  let markedSelection = null;
  let caretSelection = null;
  let saveTimer = null;
  let main = null;

  function question() {
    if (typeof state === 'undefined' || !state.lsat || !Array.isArray(state.lsat.problems)) return null;
    return state.lsat.problems.find(q => q.id === state.lsat.currentId) || null;
  }
  function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(persistNow, 400); }
  function persistNow() { clearTimeout(saveTimer); if (typeof save === 'function') save(); }
  function notice(message) { const el = document.querySelector('#lsatBreakNotice'); if (el) el.textContent = message; }
  function renderMarked(row) {
    const text = String(row.text || '');
    const marks = core.normalizeMarks(row.marks, text.length);
    let html='', pos=0;
    for (const m of marks) {
      html += esc(text.slice(pos,m.start));
      html += '<span data-break-mark="'+esc(m.term)+'" class="lsatBreakMark lsatBreakMark-'+esc(m.term)+'">'+esc(text.slice(m.start,m.end))+'</span>';
      pos = m.end;
    }
    return html + esc(text.slice(pos));
  }
  function makeRows(q) {
    const w=core.ensure(q);
    return w.rows.map((r,i)=>'<article class="lsatBreakRow" data-break-row="'+esc(r.id)+'">'+
      '<div class="lsatBreakRowHead"><span class="lsatBreakIndex">Sentence '+(i+1)+'</span><div class="lsatBreakRowActions">'+
      '<button type="button" data-break-move="-1" data-id="'+esc(r.id)+'" aria-label="Move sentence up" '+(i===0?'disabled':'')+'>↑</button>'+
      '<button type="button" data-break-move="1" data-id="'+esc(r.id)+'" aria-label="Move sentence down" '+(i===w.rows.length-1?'disabled':'')+'>↓</button>'+
      '<button type="button" data-break-split="'+esc(r.id)+'" aria-label="Split sentence at cursor">Split</button>'+
      '<button type="button" data-break-delete="'+esc(r.id)+'" aria-label="Delete this sentence">Delete</button></div></div>'+
      '<div class="lsatBreakEdit" data-break-edit="'+esc(r.id)+'" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true" aria-label="Edit sentence '+(i+1)+'" data-placeholder="Write a proposition...">'+renderMarked(r)+'</div>'+
      '<div class="lsatBreakRowFoot"><label>Function in argument <select aria-label="Function of sentence '+(i+1)+'" data-break-role="'+esc(r.id)+'">'+
      ROLES.map(([key,label])=>'<option value="'+key+'" '+(r.role===key?'selected':'')+'>'+label+'</option>').join('')+'</select></label></div></article>').join('');
  }
  function markup(q) {
    const w = core.ensure(q);
    const buttons = COLORS.map(([term,label])=>'<button type="button" data-break-color="'+term+'" class="lsatBreakColor lsatBreakColor-'+term+'">'+label+'</button>').join('');
    return '<div class="lsatBreakIntro"><strong>Break the argument into syllogistic form</strong><p>These sentences are an editable copy. The original question and your other notes remain unchanged. Text wraps automatically.</p></div>'+
      '<div class="lsatBreakTopActions"><button data-break-command="undo" '+(w.history.length?'':'disabled')+'>↶ Undo</button><button data-break-command="arrange">Arrange Major → Minor → Conclusion</button><button data-break-command="restore">Restore Original</button></div>'+
      '<div class="lsatBreakColors"><div class="lsatBreakColorsTitle">Select words within one sentence, then highlight their syllogistic term:</div><div class="lsatBreakColorButtons">'+buttons+'<button data-break-color="clear">Clear highlight</button></div></div>'+
      '<p id="lsatBreakNotice" class="lsatBreakNotice" role="status">Select a word or phrase, then tap a term color. For Split, put your cursor where the row should divide.</p>'+
      '<div class="lsatBreakRows">'+(w.rows.length?makeRows(q):'<div class="lsatBreakEmpty">All sentences removed. Use Add sentence, Undo, or Restore Original.</div>')+'</div>'+
      '<button type="button" class="lsatBreakAdd" data-break-command="add">+ Add sentence / proposition</button>';
  }
  function draw() {
    const q=question(), pane=main?.querySelector(':scope > .lsatBreakPane');
    if (!pane||!q||active!=='breakdown')return;
    pane.innerHTML=markup(q);
  }
  function toggle() {
    if (!main) return;
    main.classList.toggle('lsat-breakdown-active',active==='breakdown');
    for (const b of main.querySelectorAll('.lsatBreakNav [data-break-tab]')) {
      const on=b.dataset.breakTab===active;
      b.classList.toggle('active',on);
      b.setAttribute('aria-selected',String(on));
    }
    if(active==='breakdown')draw();
  }
  function mount() {
    main=document.getElementById('lsatMain');
    if (!main)return;
    const top=main.querySelector(':scope > .lsat-topline');
    if (!top)return;
    const q=question();if(!q)return;
    if(lastQuestion!==q.id){lastQuestion=q.id;markedSelection=null;caretSelection=null;}
    if(!main.querySelector(':scope > .lsatBreakNav')){
      const nav=document.createElement('div');nav.className='lsatBreakNav';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Problem views');
      nav.innerHTML='<button type="button" role="tab" data-break-tab="question">Original question &amp; notes</button><button type="button" role="tab" data-break-tab="breakdown">Breakdown / Syllogism</button>';
      top.insertAdjacentElement('afterend',nav);
      const pane=document.createElement('section');pane.className='lsatBreakPane';pane.setAttribute('role','tabpanel');pane.setAttribute('aria-label','Editable argument breakdown');nav.insertAdjacentElement('afterend',pane);
    }
    toggle();
  }
  function nodesToContent(edit){
    let text='', marks=[];
    const walker=document.createTreeWalker(edit,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      const str=n.nodeValue||'';
      if(!str)continue;
      const ancestor=n.parentElement?.closest('[data-break-mark]');
      const term=ancestor&&edit.contains(ancestor)?ancestor.dataset.breakMark:null;
      if(term&&core.TERMS.includes(term))marks.push({start:text.length,end:text.length+str.length,term});
      text+=str;
    }
    return {text,marks:core.normalizeMarks(marks,text.length)};
  }
  function sync(edit){
    const q=question(),id=edit?.dataset.breakEdit;if(!q||!id)return;
    const data=nodesToContent(edit);
    if(core.replace(q,id,data.text,data.marks,{record:false}))persist();
  }
  function selectionOffsets(edit,range){
    try {
      const left=document.createRange();left.selectNodeContents(edit);left.setEnd(range.startContainer,range.startOffset);
      const right=document.createRange();right.selectNodeContents(edit);right.setEnd(range.endContainer,range.endOffset);
      return [left.toString().length,right.toString().length];
    }catch(e){return null;}
  }
  function captureSelection(){
    if(active!=='breakdown'||!main||!main.isConnected)return;
    const selection=window.getSelection();if(!selection||selection.rangeCount===0)return;
    const range=selection.getRangeAt(0);
    const el=range.startContainer.nodeType===Node.ELEMENT_NODE?range.startContainer:range.startContainer.parentElement;
    const end=range.endContainer.nodeType===Node.ELEMENT_NODE?range.endContainer:range.endContainer.parentElement;
    const edit=el?.closest('.lsatBreakEdit');
    if(!edit||!edit.contains(range.startContainer)||!edit.contains(range.endContainer)||end?.closest('.lsatBreakEdit')!==edit)return;
    const offsets=selectionOffsets(edit,range);if(!offsets)return;
    caretSelection={qId:question()?.id,rowId:edit.dataset.breakEdit,offset:offsets[0]};
    if(!selection.isCollapsed&&offsets[0]<offsets[1])markedSelection={qId:question()?.id,rowId:edit.dataset.breakEdit,start:offsets[0],end:offsets[1]};
  }
  function findEdit(id){return [...main.querySelectorAll('.lsatBreakEdit')].find(el=>el.dataset.breakEdit===id);}
  function highlight(term){
    const q=question(),sel=markedSelection;
    if(!q||!sel||sel.qId!==q.id){notice('First select a word or phrase inside one sentence, then tap a color.');return;}
    const edit=findEdit(sel.rowId);
    if(edit)sync(edit);
    const result=core.mark(q,sel.rowId,sel.start,sel.end,term==='clear'?null:term);
    if(result){persistNow();markedSelection=null;draw();notice(term==='clear'?'Highlight removed.':'Highlighted '+(term==='minor'?'minor term (S)':term==='middle'?'middle term (M)':'major term (P)')+'.');}
    else notice('Please select a nonempty part of one sentence.');
  }
  function handleCommand(action){
    const q=question();if(!q)return;
    if(action==='restore'&&!confirm('Restore all original sentences for this problem? You can Undo afterward.'))return;
    if(action==='undo'){if(!core.undo(q)){notice('No changes to undo.');return;}}
    else if(action==='restore')core.restore(q);
    else if(action==='add')core.add(q,'');
    else if(action==='arrange'){if(!core.arrange(q)){notice('The sentences are already arranged by their assigned roles.');return;}}
    else return;
    markedSelection=null;caretSelection=null;persistNow();draw();
    if(action==='add'){
      const id=core.ensure(q).rows.at(-1)?.id;
      const edit=findEdit(id);if(edit)edit.focus();
    }
  }
  function onClick(event){
    const btn=event.target.closest('button');if(!btn||!main?.contains(btn))return;
    const tab=btn.dataset.breakTab;
    if(tab){active=tab;markedSelection=null;caretSelection=null;toggle();return;}
    if(active!=='breakdown')return;
    if(btn.hasAttribute('data-break-color')){highlight(btn.dataset.breakColor);return;}
    if(btn.hasAttribute('data-break-command')){handleCommand(btn.dataset.breakCommand);return;}
    const q=question();if(!q)return;
    const move=btn.dataset.breakMove,id=btn.dataset.id;
    if(move){if(core.move(q,id,Number(move))){persistNow();draw();}return;}
    if(btn.hasAttribute('data-break-delete')){if(core.remove(q,btn.dataset.breakDelete)){persistNow();draw();}return;}
    if(btn.hasAttribute('data-break-split')){
      const id=btn.dataset.breakSplit,sel=caretSelection;
      if(!sel||sel.rowId!==id||sel.qId!==q.id){notice('Place the cursor in this sentence at the point where you want to split it.');return;}
      if(core.splitRow(q,id,sel.offset)){persistNow();draw();caretSelection=null;}else notice('Place your cursor between two words to split this sentence.');
    }
  }
  function onChange(event){
    const sel=event.target.closest('select[data-break-role]');if(!sel||active!=='breakdown')return;
    const q=question();if(q&&core.setRole(q,sel.dataset.breakRole,sel.value))persistNow();
  }
  function onFocus(event){
    const edit=event.target.closest('.lsatBreakEdit');if(!edit||active!=='breakdown')return;
    const q=question();if(q)core.checkpoint(q);
  }
  function onInput(event){
    const edit=event.target.closest('.lsatBreakEdit');if(!edit||active!=='breakdown')return;
    sync(edit);
  }
  function onBeforeInput(event){
    if(!event.target.closest('.lsatBreakEdit'))return;
    if(event.inputType==='insertParagraph'||event.inputType==='insertLineBreak'){
      event.preventDefault();document.execCommand('insertText',false,'\n');
    }
  }
  function onPaste(event){
    if(!event.target.closest('.lsatBreakEdit'))return;
    event.preventDefault();document.execCommand('insertText',false,event.clipboardData?.getData('text/plain')||'');
  }
  function init(){
    main=document.getElementById('lsatMain');if(!main)return;
    main.addEventListener('click',onClick);
    main.addEventListener('change',onChange);
    main.addEventListener('focusin',onFocus);
    main.addEventListener('input',onInput);
    main.addEventListener('beforeinput',onBeforeInput);
    main.addEventListener('paste',onPaste);
    main.addEventListener('mousedown',e=>{if(e.target.closest('[data-break-color]'))e.preventDefault();});
    document.addEventListener('selectionchange',captureSelection);
    const observer=new MutationObserver(()=>{
      if(main.querySelector(':scope > .lsat-topline')&&!main.querySelector(':scope > .lsatBreakNav'))mount();
    });
    observer.observe(main,{childList:true});
    mount();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();