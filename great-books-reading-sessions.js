(function(root,factory){
  const core=typeof module==='object'&&module.exports?require('./great-books-reading-sessions-core.js'):root.HabitGreatBooksSessionsCore;
  const api=factory(core,root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root&&root.document) api.init();
})(typeof window!=='undefined'?window:globalThis,function(core,root){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getSessions(app,id){return app&&app.books&&app.books.greatBooks&&app.books.greatBooks.readingSessions&&app.books.greatBooks.readingSessions[id]||[];}
  function buildGridHtml(app,catalog,q){
    const gb=app.books.greatBooks,filters=gb.planFilters||{part:'all',collection:'all'},query=String(q||'').trim().toLowerCase();
    const items=(catalog||[]).filter(x=>(filters.part==='all'||x.part===filters.part)&&(filters.collection==='all'||x.collection===filters.collection)).filter(x=>!query||[x.title,x.author,x.stageLabel,x.collectionLabel].join(' ').toLowerCase().includes(query));
    const maxSessions=items.reduce((m,x)=>Math.max(m,getSessions(app,x.id).length),0),sessionCols=Math.max(4,maxSessions+1);
    let html=`<table class="gbProgressTable gbSessionTable"><thead><tr><th class="gbSessionReadingHead">Reading</th>${Array.from({length:sessionCols},(_,i)=>`<th>Read ${i+1}</th>`).join('')}<th>%</th><th>Complete</th></tr></thead><tbody>`;
    let lastGroup='';
    items.forEach(item=>{
      const groupKey=`${item.part}-${item.collection}`;
      if(groupKey!==lastGroup){lastGroup=groupKey;html+=`<tr class="gbPlanGroupRow"><td colspan="${sessionCols+3}"><strong>Part ${esc(item.part)} - ${esc(item.stageLabel||'')}</strong><span>${esc(item.collectionLabel||'')}</span></td></tr>`;}
      const sessions=getSessions(app,item.id),total=core.totalAssigned(item),read=core.sessionPagesRead(sessions),manual=(gb.completedIds||[]).includes(item.id),complete=manual||(total>0&&read>=total),pct=complete?100:(total?Math.round(read/total*100):0),next=complete?null:core.nextAssignedPage(item,sessions);
      html+=`<tr class="${complete?'gbCompleteRow':''}" data-gb-log-row="${esc(item.id)}"><td class="gbSessionReading"><strong>${esc(item.title)}</strong><div class="small">${esc(item.author)}${item.volume?` - Vol. ${esc(item.volume)}`:''} - ${item.collection==='gateway'?'Gateway':'Great Books'}</div><div class="small">Assigned: ${esc(item.pageNumbers||'No page range')}${total?` - ${total} pages`:''}</div><div class="gbNextPage">${complete?'Complete':next!=null?`Next: ${next}`:'No page range'}</div><div class="gbSessionRowActions"><button data-gb-log="${esc(item.id)}" ${total?'':'disabled'}>Log pages</button><button data-gb-shared="${esc(item.id)}">Text/Pages</button></div></td>`;
      for(let i=0;i<sessionCols;i++){
        const s=sessions[i];
        html+=s?`<td class="gbSessionCell"><button class="gbSessionChip" data-gb-session-detail="${esc(item.id)}|${i}">${esc(s.pageLabel)}</button></td>`:`<td class="gbSessionCell gbSessionEmpty"><span>-</span></td>`;
      }
      html+=`<td class="gbRowPct"><strong>${pct}%</strong></td><td><button class="gbCompleteBtn ${complete?'manualComplete':''}" data-gb-complete="${esc(item.id)}">${complete?'Complete':'Mark complete'}</button></td></tr>`;
    });
    return html+'</tbody></table>';
  }
  function init(){
    if(!root.document||!core||typeof renderGreatBooks!=='function'||typeof greatBooksProgressGrid==='undefined'||!greatBooksProgressGrid)return;
    const originalRender=renderGreatBooks;
    const catalog=()=>typeof GREAT_BOOKS_CATALOG!=='undefined'?GREAT_BOOKS_CATALOG:[];
    function ensureState(){
      const gb=state.books.greatBooks;gb.readingSessions=gb.readingSessions||{};
      if(gb.readingSessionsVersion===1)return;
      catalog().forEach(item=>{if(!Array.isArray(gb.readingSessions[item.id]))gb.readingSessions[item.id]=core.migratePageByDate(item,(gb.pageByDate||{})[item.id]||{});});
      gb.readingSessionsVersion=1;save();
    }
    function ensureModal(){
      let back=document.getElementById('gbReadingSessionModalBackdrop');if(back)return back;
      back=document.createElement('div');back.id='gbReadingSessionModalBackdrop';back.className='gbSessionModalBackdrop';back.innerHTML='<div class="gbSessionModal" role="dialog" aria-modal="true"><button class="gbSessionModalClose" type="button" aria-label="Close">x</button><div id="gbSessionModalBody"></div></div>';
      document.body.appendChild(back);back.querySelector('.gbSessionModalClose').onclick=()=>back.classList.remove('open');back.onclick=e=>{if(e.target===back)back.classList.remove('open');};return back;
    }
    function openLog(item){
      const sessions=state.books.greatBooks.readingSessions[item.id]||[],total=core.totalAssigned(item),read=core.sessionPagesRead(sessions),remaining=total-read,next=core.nextAssignedPage(item,sessions);if(!total)return;
      const back=ensureModal(),body=back.querySelector('#gbSessionModalBody');
      body.innerHTML=`<h3>${esc(item.title)}</h3><div class="small">Assigned: ${esc(item.pageNumbers||'')} - ${remaining} pages remaining</div><div class="gbSessionPromptNext">Start on page <strong>${next}</strong></div><label class="gbSessionPromptLabel">How many pages did you read?<input id="gbSessionPageCount" type="number" inputmode="numeric" min="1" max="${remaining}" step="1" placeholder="2"></label><div class="gbSessionModalActions"><button type="button" data-gb-session-cancel>Cancel</button><button type="button" class="primary" data-gb-session-save>Add reading</button></div>`;
      back.classList.add('open');const input=body.querySelector('#gbSessionPageCount');setTimeout(()=>input.focus(),0);body.querySelector('[data-gb-session-cancel]').onclick=()=>back.classList.remove('open');
      const submit=()=>{const count=Number(input.value);try{const result=core.createSession(item,sessions,count,todayISO(),typeof cryptoId==='function'?cryptoId():String(Date.now()));state.books.greatBooks.readingSessions[item.id]=result.sessions;state.books.greatBooks.pageByDate[item.id]=state.books.greatBooks.pageByDate[item.id]||{};state.books.greatBooks.pageByDate[item.id][todayISO()]=result.session.endPage;if(result.complete&&!state.books.greatBooks.completedIds.includes(item.id))state.books.greatBooks.completedIds.push(item.id);save();back.classList.remove('open');render();}catch(error){alert(error.message);}};
      body.querySelector('[data-gb-session-save]').onclick=submit;input.onkeydown=e=>{if(e.key==='Enter')submit();};
    }
    function openDetail(item,index){
      const s=(state.books.greatBooks.readingSessions[item.id]||[])[index];if(!s)return;const back=ensureModal(),body=back.querySelector('#gbSessionModalBody'),date=new Date(`${s.date}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});body.innerHTML=`<h3>${esc(item.title)}</h3><div class="gbSessionDetailPages">${esc(s.pageLabel)}</div><div>Read ${esc(date)}</div><div class="small">${s.count} page${s.count===1?'':'s'}</div><div class="gbSessionModalActions"><button type="button" class="primary" data-gb-session-close>Close</button></div>`;back.classList.add('open');body.querySelector('[data-gb-session-close]').onclick=()=>back.classList.remove('open');
    }
    function bindGrid(){
      greatBooksProgressGrid.querySelectorAll('[data-gb-log]').forEach(b=>b.onclick=e=>{e.stopPropagation();const item=catalog().find(x=>x.id===b.dataset.gbLog);if(item)openLog(item);});
      greatBooksProgressGrid.querySelectorAll('[data-gb-log-row]').forEach(row=>row.onclick=e=>{if(e.target.closest('button,[data-gb-session-detail]'))return;const item=catalog().find(x=>x.id===row.dataset.gbLogRow);if(item&&core.totalAssigned(item))openLog(item);});
      greatBooksProgressGrid.querySelectorAll('[data-gb-session-detail]').forEach(b=>b.onclick=e=>{e.stopPropagation();const [id,index]=b.dataset.gbSessionDetail.split('|'),item=catalog().find(x=>x.id===id);if(item)openDetail(item,Number(index));});
      greatBooksProgressGrid.querySelectorAll('[data-gb-complete]').forEach(b=>b.onclick=e=>{e.stopPropagation();const gb=state.books.greatBooks,id=b.dataset.gbComplete;if(gb.completedIds.includes(id))gb.completedIds=gb.completedIds.filter(x=>x!==id);else gb.completedIds=[...new Set([...gb.completedIds,id])];save();render();});
      greatBooksProgressGrid.querySelectorAll('[data-gb-shared]').forEach(b=>b.onclick=e=>{e.stopPropagation();state.books.greatBooks.selectedId=b.dataset.gbShared;save();if(typeof refreshGreatBookShared==='function')refreshGreatBookShared();});
    }
    function relabel(){
      const tab=document.getElementById('tab-greatbooks'),sub=tab&&tab.querySelector(':scope > .row > div > .sub'),notice=tab&&tab.querySelector('.cloudNotice');if(sub)sub.textContent='Click a reading and enter only the number of pages you read. The app calculates the page range and your next starting page.';if(notice)notice.textContent='The Reading column stays frozen. Reading sessions stay next to each other instead of being spread across calendar dates. Tap a page-range cell to see the date it was read.';if(typeof greatBooksDays!=='undefined'&&greatBooksDays)greatBooksDays.style.display='none';
    }
    function render(){
      ensureState();originalRender();relabel();greatBooksProgressGrid.innerHTML=buildGridHtml(state,catalog(),typeof greatBooksSearch!=='undefined'&&greatBooksSearch?greatBooksSearch.value:'');bindGrid();
    }
    renderGreatBooks=render;if(typeof greatBooksSearch!=='undefined'&&greatBooksSearch)greatBooksSearch.oninput=render;ensureState();render();
  }
  return {buildGridHtml,init};
});
