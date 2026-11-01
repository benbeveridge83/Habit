(function(){'use strict';
const engine=window.HabitLSATAnnotations;if(!engine)return;
const palette={red:'#fecaca',yellow:'#fef08a',blue:'#bfdbfe',green:'#bbf7d0',purple:'#e9d5ff'};
let color=localStorage.getItem('lsatPaintColor')||'yellow';
let mode='off',last=null;
const modes={underline:['single','double','bold',null],frame:['circle','square','rounded',null]};
const label={single:'Single underline',double:'Double underline',bold:'Bold underline',circle:'Circle',square:'Square',rounded:'Rounded square',off:'Off'};
const question=()=>typeof state!=='undefined'?state.lsat?.problems?.find(q=>q.id===state.lsat.currentId):null;
const saveNow=()=>{if(typeof save==='function')save();};
function sourceNode(){return document.querySelector('#lsatMain > .lsat-stem');}
function repaint(){const q=question(),stem=sourceNode();if(q&&stem){const html=engine.render(q);if(stem.innerHTML!==html)stem.innerHTML=html;}}
function updateBar(){
  const bar=document.querySelector('#lsatMain .lsatInkBar');if(!bar)return;
  bar.querySelectorAll('[data-ink-mode]').forEach(b=>{const kind=b.dataset.inkMode;b.classList.toggle('active',mode===kind);b.setAttribute('aria-pressed',String(mode===kind));});
  bar.querySelectorAll('[data-ink-color]').forEach(b=>b.classList.toggle('active',mode==='color'&&b.dataset.inkColor===color));
  bar.querySelector('[data-ink-mode="underline"]').textContent='Underline'+(last?.type==='underline'&&last?.style?' · '+label[last.style]:'');
  bar.querySelector('[data-ink-mode="frame"]').textContent='Outline'+(last?.type==='frame'&&last?.style?' · '+label[last.style]:'');
}
function position(stem,node,offset){try{const range=document.createRange();range.selectNodeContents(stem);range.setEnd(node,offset);return range.toString().length;}catch(_){return null;}}
function offsets(e,stem){
  const sel=window.getSelection();
  if(sel&&sel.rangeCount&&!sel.isCollapsed&&stem.contains(sel.anchorNode)&&stem.contains(sel.focusNode)){
    const range=sel.getRangeAt(0),start=position(stem,range.startContainer,range.startOffset),end=position(stem,range.endContainer,range.endOffset);
    if(start!==null&&end!==null&&start<end)return {start,end};
  }
  let point=document.caretPositionFromPoint?.(e.clientX,e.clientY);
  let node=point?.offsetNode,off=point?.offset;
  if(!node){const r=document.caretRangeFromPoint?.(e.clientX,e.clientY);node=r?.startContainer;off=r?.startOffset;}
  if(!node)return null;
  const at=position(stem,node,off);return at===null?null:{start:at,end:at};
}
function applyMark(e){
 if(mode==='off')return;
 const q=question(),stem=sourceNode();if(!q||!stem)return;
 const range=offsets(e,stem);if(!range)return;
 const text=q.stem||'';
 let target;
 if(mode==='underline'){target=engine.sentenceAt(text,range.start);}
 else if(range.end>range.start){target=range;}
 else target=engine.wordAt(text,range.start);
 if(!target)return;
 if(mode==='color'){
   engine.setColor(q,target,color);
 }else{
   const previous=(q[mode==='underline'?'underlineMarks':'frameMarks']||[]).find(m=>m.start===target.start&&m.end===target.end);
   const available=modes[mode];
   const next=previous?available[(available.indexOf(previous.style)+1)%available.length]:available[0];
   if(mode==='underline')engine.setUnderline(q,target,next);
   else engine.setFrame(q,target,next);
   last={type:mode,style:next,start:target.start,end:target.end,question:q.id};
 }
 saveNow();repaint();updateBar();
}
function mount(){
 const stem=sourceNode(),q=question();if(!stem||!q)return;
 if(!stem.previousElementSibling?.classList.contains('lsatInkBar')){
  const bar=document.createElement('div');bar.className='lsatInkBar';
  bar.innerHTML='<div class="lsatInkButtons"><button type="button" data-ink-mode="color">🖍 Color</button><button type="button" data-ink-mode="underline">U̲ Underline</button><button type="button" data-ink-mode="frame">◯ Outline</button><button type="button" data-ink-mode="off">Done</button></div><div class="lsatInkPalette">'+Object.entries(palette).map(([key,value])=>'<button type="button" data-ink-color="'+key+'" style="background:'+value+'">'+key+'</button>').join('')+'</div><small>Pick a tool, then tap a word or select a phrase. Underline applies to the entire sentence. Tap the same marked sentence or word again to cycle its style.</small><button type="button" data-ink-clear>Clear annotations</button>';
  stem.insertAdjacentElement('beforebegin',bar);
  bar.addEventListener('click',ev=>{
   const b=ev.target.closest('button');if(!b)return;
   if(b.dataset.inkColor){mode='color';color=b.dataset.inkColor;localStorage.setItem('lsatPaintColor',color);}
   else if(b.hasAttribute('data-ink-mode')){const nextMode=b.dataset.inkMode;if(nextMode===mode&&last?.type===mode&&last.question===question()?.id&&(mode==='underline'||mode==='frame')){const q=question();const values=modes[mode];const marks=q[mode==='underline'?'underlineMarks':'frameMarks']||[];const previous=marks.find(m=>m.start===last.start&&m.end===last.end);if(previous){const next=values[(values.indexOf(previous.style)+1)%values.length];if(mode==='underline')engine.setUnderline(q,last,next);else engine.setFrame(q,last,next);last.style=next;saveNow();repaint();}}mode=nextMode;}
   else if(b.hasAttribute('data-ink-clear')){
    if(!confirm('Clear all colors, underlines and outlines for this problem?'))return;
    const q=question();q.paintMarks=[];q.underlineMarks=[];q.frameMarks=[];saveNow();repaint();
   }
   updateBar();
  });
  stem.addEventListener('click',applyMark);
 }
 repaint();updateBar();
}
function init(){
 const main=document.getElementById('lsatMain');if(!main)return;
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;mount();});}).observe(main,{childList:true});
 mount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();