/* Pure logic for LSAT question annotations. Compatible with the original paintMarks data. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HabitLSATAnnotations=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const COLORS=['red','yellow','blue','green','purple'];
  const UNDERLINES=['single','double','bold'];
  const FRAMES=['circle','square','rounded'];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sentences(source){
    const text=String(source||'');
    if(!text.trim())return [];
    const segments=typeof Intl!=='undefined'&&Intl.Segmenter?
      [...new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)].map(m=>({text:m.segment,start:m.index})):
      [...text.matchAll(/[^.!?\n]+(?:[.!?]+|$)/g)].map(m=>({text:m[0],start:m.index}));
    return segments.map(({text:part,start})=>{
      const left=(part.match(/^\s*/)||[''])[0].length;
      const right=(part.match(/\s*$/)||[''])[0].length;
      return {start:start+left,end:start+part.length-right};
    }).filter(s=>s.end>s.start);
  }
  function sentenceAt(text,at){return sentences(text).find(r=>at>=r.start&&at<=r.end)||null;}
  function wordAt(text,at){
    text=String(text||'');
    if(!text||!Number.isInteger(at)||at<0||at>=text.length)return null;
    const isWord=c=>/\p{L}|\p{N}|[_’-]/u.test(c||'');
    if(!isWord(text[at]) && at>0 && isWord(text[at-1]))at--;
    if(!isWord(text[at]))return null;
    let start=at,end=at+1;
    while(start>0&&isWord(text[start-1]))start--;
    while(end<text.length&&isWord(text[end]))end++;
    return {start,end};
  }
  function validRange(q,r){
    const length=String(q?.stem||'').length;
    return r&&Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.start>=0&&r.end<=length&&r.end>r.start;
  }
  function assign(q,key,r,kind,validStyles,prop){
    if(!validRange(q,r)||kind!==null&&!validStyles.includes(kind))return false;
    const old=Array.isArray(q[key])?q[key]:[];
    const clean=old.filter(m=>m.end<=r.start||m.start>=r.end);
    if(kind!==null)clean.push({start:r.start,end:r.end,[prop]:kind});
    q[key]=clean.sort((a,b)=>a.start-b.start);
    return true;
  }
  const setUnderline=(q,range,style)=>assign(q,'underlineMarks',range,style,UNDERLINES,'style');
  const setFrame=(q,range,style)=>assign(q,'frameMarks',range,style,FRAMES,'style');
  const setColor=(q,range,color)=>assign(q,'paintMarks',range,color,COLORS,'color');
  function render(q){
    const text=String(q?.stem||'');
    if(!text)return '';
    const layers=[
      {key:'underlineMarks',styles:UNDERLINES,kind:'style',prefix:'lsatInkUnderline'},
      {key:'frameMarks',styles:FRAMES,kind:'style',prefix:'lsatInkFrame'},
      {key:'paintMarks',styles:COLORS,kind:'color',prefix:'lsatInkColor'}
    ];
    function draw(start,end,level){
      if(level>=layers.length)return esc(text.slice(start,end));
      const spec=layers[level];
      const marks=(Array.isArray(q[spec.key])?q[spec.key]:[]).filter(m=>Number.isInteger(m.start)&&Number.isInteger(m.end)&&m.end>start&&m.start<end&&spec.styles.includes(m[spec.kind])).sort((a,b)=>a.start-b.start).slice(0,1000);
      let html='',pos=start;
      for(const m of marks){
        const a=Math.max(start,m.start,pos),b=Math.min(end,m.end);
        if(b<=a)continue;
        if(a>pos)html+=draw(pos,a,level+1);
        const classname=spec.prefix+'--'+m[spec.kind];
        const tag=level===2?'mark':'span';
        html+='<'+tag+' class="'+classname+'">'+draw(a,b,level+1)+'</'+tag+'>';
        pos=b;
      }
      if(pos<end)html+=draw(pos,end,level+1);
      return html;
    }
    return draw(0,text.length,0);
  }
  return {COLORS,UNDERLINES,FRAMES,sentences,sentenceAt,wordAt,setUnderline,setFrame,setColor,render};
});