/* Editable LSAT reasoning workspace. Original q.stem and q.notes remain untouched. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HabitLSATBreakdownCore=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const ROLES=['unassigned','major-premise','minor-premise','conclusion','other'];
const TERMS=['minor','middle','major'];
const newId=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const clone=x=>JSON.parse(JSON.stringify(x));
function split(text){
  text=String(text||'').trim();if(!text)return [];
  let sentences=[];
  if(typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'){
    const seg=new Intl.Segmenter('en',{granularity:'sentence'});
    sentences=[...seg.segment(text)].map(x=>x.segment.trim()).filter(Boolean);
  }else{
    sentences=text.split(/(?<=[.!?])\s+(?=["“'([]?[A-Z])/u).map(x=>x.trim()).filter(Boolean);
  }
  // Segmenter may split after honorifics (Dr. Smith), which are not sentences.
  const joined=[];
  for(const part of sentences){
    if(joined.length && /(?:^|\s)(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Gen|Sen|Rep)\.$/i.test(joined[joined.length-1])) joined[joined.length-1]+=' '+part;
    else joined.push(part);
  }
  return joined.length?joined:[text];
}
function row(text){return {id:newId(),text:String(text||''),role:'unassigned',marks:[]};}
function fromOriginal(source){return split(source).map(row);}
function ensure(question){
  if(!question||typeof question!=='object')throw Error('Question required');
  if(!question.breakdown||!Array.isArray(question.breakdown.rows)){
    const source=String(question.stem||'');
    question.breakdown={source,rows:fromOriginal(source),history:[]};
  }
  const w=question.breakdown;
  if(!Array.isArray(w.history))w.history=[];
  for(const item of w.rows){if(!Array.isArray(item.marks))item.marks=[];if(!ROLES.includes(item.role))item.role='unassigned';}
  return w;
}
function checkpoint(question){const w=ensure(question);w.history.push(clone(w.rows));if(w.history.length>12)w.history.shift();return w;}
function lookup(q,id){return ensure(q).rows.find(item=>item.id===id);}
function move(q,id,step){const w=ensure(q),a=w.rows,i=a.findIndex(r=>r.id===id),next=i+step;if(i<0||next<0||next>=a.length)return false;checkpoint(q);[a[i],a[next]]=[a[next],a[i]];return true;}
function remove(q,id){const w=ensure(q),i=w.rows.findIndex(r=>r.id===id);if(i<0)return false;checkpoint(q);w.rows.splice(i,1);return true;}
function add(q,text='',at){const w=ensure(q);checkpoint(q);const r=row(text);const i=Number.isInteger(at)?Math.max(0,Math.min(at,w.rows.length)):w.rows.length;w.rows.splice(i,0,r);return r;}
function setRole(q,id,role){const r=lookup(q,id);if(!r||!ROLES.includes(role))return false;if(r.role===role)return false;checkpoint(q);r.role=role;return true;}
function normalizeMarks(marks,length){
  const safe=(Array.isArray(marks)?marks:[]).filter(m=>m&&TERMS.includes(m.term)&&Number.isInteger(m.start)&&Number.isInteger(m.end)&&m.start>=0&&m.end<=length&&m.start<m.end).sort((a,b)=>a.start-b.start);
  const merged=[];
  for(const m of safe){const last=merged[merged.length-1];const start=last?Math.max(last.end,m.start):m.start;if(start>=m.end)continue;if(last&&last.term===m.term&&last.end===start)last.end=m.end;else merged.push({start,end:m.end,term:m.term});}
  return merged;
}
function replace(q,id,text,marks,options){const r=lookup(q,id);if(!r)return false;text=String(text);const clean=normalizeMarks(marks,text.length);if(r.text===text&&JSON.stringify(r.marks)===JSON.stringify(clean))return false;if(options?.record!==false)checkpoint(q);r.text=text;r.marks=clean;return true;}
function mark(q,id,start,end,term){const r=lookup(q,id);if(!r||!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>=end||end>r.text.length||!(term===null||TERMS.includes(term)))return false;
  const retained=[];
  for(const m of r.marks){if(m.end<=start||m.start>=end){retained.push({...m});continue;}if(m.start<start)retained.push({start:m.start,end:start,term:m.term});if(m.end>end)retained.push({start:end,end:m.end,term:m.term});}
  if(term!==null)retained.push({start,end,term});
  const marks=normalizeMarks(retained,r.text.length);if(JSON.stringify(marks)===JSON.stringify(r.marks))return false;
  checkpoint(q);r.marks=marks;return true;
}
function arrange(q){
  const w=ensure(q),rank={'major-premise':0,'minor-premise':1,conclusion:2,unassigned:3,other:4};
  const sorted=[...w.rows].sort((a,b)=>rank[a.role]-rank[b.role]);
  if(sorted.every((r,i)=>r===w.rows[i]))return false;
  checkpoint(q);w.rows.splice(0,w.rows.length,...sorted);return true;
}
function splitRow(q,id,offset){
  const w=ensure(q),i=w.rows.findIndex(r=>r.id===id);if(i<0)return false;
  const r=w.rows[i];if(!Number.isInteger(offset)||offset<=0||offset>=r.text.length)return false;
  const l=r.text.slice(0,offset).trimEnd(),tail=r.text.slice(offset),right=tail.trimStart();
  if(!l||!right)return false;
  const rightStart=offset+(tail.length-right.length);
  const lmarks=normalizeMarks(r.marks.map(m=>({start:m.start,end:Math.min(m.end,l.length),term:m.term})),l.length);
  const rmarks=normalizeMarks(r.marks.map(m=>({start:Math.max(0,m.start-rightStart),end:m.end-rightStart,term:m.term})),right.length);
  checkpoint(q);r.text=l;r.marks=lmarks;
  const second=row(right);second.marks=rmarks;second.role=r.role;w.rows.splice(i+1,0,second);
  return true;
}
function undo(q){const w=ensure(q);if(!w.history.length)return false;w.rows=w.history.pop();return true;}
function restore(q){const w=ensure(q);checkpoint(q);w.rows=fromOriginal(w.source);return true;}
return {ROLES,TERMS,split,ensure,checkpoint,lookup,move,remove,add,setRole,replace,mark,arrange,splitRow,undo,restore,normalizeMarks};
});