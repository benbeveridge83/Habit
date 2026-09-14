(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.HabitGreatBooksSessionsCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  function normalizeRanges(item){
    const raw=Array.isArray(item&&item.ranges)?item.ranges:[];
    const ranges=raw.map(r=>[Number(r[0]),Number(r[1])]).filter(r=>Number.isFinite(r[0])&&Number.isFinite(r[1])&&r[1]>=r[0]);
    if(ranges.length) return ranges;
    const start=Number(item&&item.firstPage),end=Number(item&&item.lastPage);
    return Number.isFinite(start)&&Number.isFinite(end)&&end>=start?[[start,end]]:[];
  }
  function totalAssigned(item){return normalizeRanges(item).reduce((n,[s,e])=>n+(e-s+1),0);}
  function pagesReadThroughPage(item,page){
    const p=Number(page);if(!Number.isFinite(p))return 0;
    let read=0;
    for(const [s,e] of normalizeRanges(item)){
      if(p<s)break;
      read+=p>=e?(e-s+1):(p-s+1);
      if(p<e)break;
    }
    return Math.max(0,Math.min(totalAssigned(item),read));
  }
  function pageAtOffset(item,offset){
    let remaining=Number(offset);
    if(!Number.isInteger(remaining)||remaining<0)return null;
    for(const [s,e] of normalizeRanges(item)){
      const len=e-s+1;
      if(remaining<len)return s+remaining;
      remaining-=len;
    }
    return null;
  }
  function segmentsForSpan(item,startOffset,count){
    const total=totalAssigned(item),start=Number(startOffset),qty=Number(count);
    if(!Number.isInteger(start)||start<0||!Number.isInteger(qty)||qty<=0||start>=total)return [];
    let remaining=Math.min(qty,total-start),offset=start,segments=[];
    for(const [s,e] of normalizeRanges(item)){
      const len=e-s+1;
      if(offset>=len){offset-=len;continue;}
      const segStart=s+offset,take=Math.min(remaining,e-segStart+1),segEnd=segStart+take-1;
      segments.push([segStart,segEnd]);
      remaining-=take;offset=0;
      if(!remaining)break;
    }
    return segments;
  }
  function formatSegments(segments){return segments.map(([s,e])=>s===e?String(s):`${s}-${e}`).join(', ');}
  function sessionPagesRead(sessions){return (Array.isArray(sessions)?sessions:[]).reduce((n,s)=>n+Math.max(0,Number(s&&s.count)||0),0);}
  function nextAssignedPage(item,sessions){return pageAtOffset(item,sessionPagesRead(sessions));}
  function createSession(item,sessions,count,date,id){
    const existing=Array.isArray(sessions)?sessions:[],read=sessionPagesRead(existing),total=totalAssigned(item),remaining=total-read,qty=Number(count);
    if(!Number.isInteger(qty)||qty<=0)throw new Error('Enter a whole number of pages greater than zero.');
    if(remaining<=0)throw new Error('This reading is already complete.');
    if(qty>remaining)throw new Error(`Only ${remaining} pages remain.`);
    const segments=segmentsForSpan(item,read,qty),startPage=segments[0][0],endPage=segments[segments.length-1][1];
    const session={id:id||String(Date.now()),date:String(date||''),count:qty,startPage,endPage,segments,pageLabel:formatSegments(segments)};
    const updated=[...existing,session],pagesRead=read+qty;
    return {session,sessions:updated,pagesRead,nextPage:pageAtOffset(item,pagesRead),complete:pagesRead>=total};
  }
  function migratePageByDate(item,logs){
    let prior=0,index=0;const sessions=[];
    Object.entries(logs||{}).filter(([,v])=>Number.isFinite(Number(v))).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([date,page])=>{
      const cumulative=pagesReadThroughPage(item,Number(page)),delta=Math.max(0,cumulative-prior);
      if(delta>0){
        const result=createSession(item,sessions,delta,date,`legacy-${date}-${index++}`);
        sessions.push(result.session);
        prior=cumulative;
      }
    });
    return sessions;
  }
  return {normalizeRanges,totalAssigned,pagesReadThroughPage,pageAtOffset,segmentsForSpan,formatSegments,sessionPagesRead,nextAssignedPage,createSession,migratePageByDate};
});
