(async () => {
  if (typeof window.loadGradedReadingPlan === 'function') await window.loadGradedReadingPlan();
  const PLAN_VERSION = '2026-09-07-v1';
  const plan = window.GRADED_READING_PLAN;
  const rawItems = window.GRADED_READING_PLAN_ITEMS || [];
  if (!plan || !rawItems.length || typeof GREAT_BOOKS_CATALOG === 'undefined') return;

  const oldCatalog = GREAT_BOOKS_CATALOG.map(x => ({...x}));
  const newCatalog = rawItems.map(r => ({
    id:r[0], part:r[1], stageLabel:plan.l[r[1]], collection:r[2], collectionLabel:plan.c[r[2]],
    volume:r[3], author:r[4], title:r[5], pageNumbers:r[6], totalPages:r[7], ranges:r[8] || [], sourcePlanPage:r[9],
    firstPage:(r[8] && r[8].length) ? r[8][0][0] : null,
    lastPage:(r[8] && r[8].length) ? r[8][r[8].length - 1][1] : null,
    pages:Number.isFinite(Number(r[7])) ? Number(r[7]) : 0
  }));
  GREAT_BOOKS_CATALOG.splice(0, GREAT_BOOKS_CATALOG.length, ...newCatalog);

  const norm = v => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const oldToNew = new Map();
  oldCatalog.forEach(old => {
    const t = norm(old.title), v = norm(old.volume), a = norm(old.author);
    let match = newCatalog.find(n => norm(n.title) === t && norm(n.volume) === v && norm(n.author) === a);
    if (!match) match = newCatalog.find(n => norm(n.title) === t && norm(n.volume) === v);
    if (!match) match = newCatalog.find(n => norm(n.title) === t);
    if (match) oldToNew.set(String(old.id), match.id);
  });

  function ensureGBState(){
    state.books = state.books || {items:[],greatBooks:{}};
    state.books.greatBooks = state.books.greatBooks || {};
    const gb = state.books.greatBooks;
    gb.pageByDate = gb.pageByDate || {};
    gb.completedIds = Array.isArray(gb.completedIds) ? gb.completedIds : [];
    gb.planFilters = gb.planFilters || {part:'all',collection:'all'};
    if (gb.planDataVersion === PLAN_VERSION) return;

    const migratedPages = {...gb.pageByDate};
    Object.entries(gb.pageByDate).forEach(([oldId,logs]) => {
      const next = oldToNew.get(String(oldId));
      if (next && !migratedPages[next]) migratedPages[next] = logs;
    });
    gb.pageByDate = migratedPages;
    gb.completedIds = [...new Set(gb.completedIds.map(id => oldToNew.get(String(id)) || id).filter(id => newCatalog.some(x => x.id === id)))];
    if (gb.selectedId) gb.selectedId = oldToNew.get(String(gb.selectedId)) || gb.selectedId;
    if (gb.currentId) gb.currentId = oldToNew.get(String(gb.currentId)) || gb.currentId;
    (state.books.items || []).forEach(b => {
      if (!b.greatBookId) return;
      const nextId = oldToNew.get(String(b.greatBookId));
      if (!nextId) return;
      b.greatBookId = nextId;
      const item = newCatalog.find(x => x.id === nextId);
      if (item?.totalPages) {
        b.totalPages = item.totalPages;
        b.currentPage = Math.min(Number(b.currentPage)||0, b.totalPages);
      }
    });
    gb.planDataVersion = PLAN_VERSION;
    save();
  }

  function totalPages(item){ return Number.isFinite(Number(item?.totalPages)) ? Math.max(0,Number(item.totalPages)) : 0; }
  function entries(app,item){
    return Object.entries(app?.books?.greatBooks?.pageByDate?.[item.id] || {})
      .filter(([,v]) => Number.isFinite(Number(v)) && Number(v) > 0)
      .sort((a,b) => a[0].localeCompare(b[0]));
  }
  function pageAt(app,item,date){
    const arr = entries(app,item).filter(([d]) => d <= date);
    return arr.length ? Number(arr[arr.length-1][1]) : 0;
  }
  function rangePagesRead(item,page){
    if (!page || !Array.isArray(item.ranges) || !item.ranges.length) return 0;
    let read = 0;
    for (const [start,end] of item.ranges) {
      if (page < start) break;
      if (page >= end) read += end - start + 1;
      else { read += page - start + 1; break; }
    }
    return Math.max(0,Math.min(totalPages(item),read));
  }
  function manuallyComplete(app,item){ return (app?.books?.greatBooks?.completedIds || []).includes(item.id); }
  function pagesRead(app,item,date=todayISO()){
    const total = totalPages(item);
    if (!total) return 0;
    if (manuallyComplete(app,item)) return total;
    return rangePagesRead(item,pageAt(app,item,date));
  }
  function itemPercent(app,item,date=todayISO()){
    if (manuallyComplete(app,item)) return 100;
    const total = totalPages(item);
    if (!total) return 0;
    return Math.max(0,Math.min(100,Math.round(pagesRead(app,item,date)/total*100)));
  }
  function itemIsComplete(app,item){ return itemPercent(app,item) >= 100; }

  greatBookTotal = totalPages;
  greatBookPageEntries = entries;
  greatBookPageAt = pageAt;
  greatBookPagesRead = pagesRead;

  function subset(part='all',collection='all'){
    return newCatalog.filter(x => (part === 'all' || x.part === part) && (collection === 'all' || x.collection === collection));
  }
  function summary(app,items){
    const count = items.length;
    const knownPages = items.reduce((s,x)=>s+totalPages(x),0);
    const readPages = items.reduce((s,x)=>s+pagesRead(app,x),0);
    const pct = count ? Math.round(items.reduce((s,x)=>s+itemPercent(app,x),0)/count) : 0;
    const completeCount = items.filter(x=>itemIsComplete(app,x)).length;
    return {count,knownPages,readPages,leftPages:Math.max(0,knownPages-readPages),pct,completeCount};
  }
  function stageSummary(app,part){
    return {
      gateway:summary(app,subset(part,'gateway')),
      greatbooks:summary(app,subset(part,'greatbooks')),
      total:summary(app,subset(part,'all'))
    };
  }

  function esc(v){ return escapeHtml(String(v ?? '')); }
  function progressBar(pct){ return `<div class="gbPlanMiniBar"><span style="width:${pct}%"></span></div>`; }
  function statBlock(label,s){
    return `<div class="gbPlanStat"><span>${esc(label)}</span><strong>${s.pct}%</strong>${progressBar(s.pct)}<small>${s.completeCount}/${s.count} readings complete</small></div>`;
  }
  function renderSummaryPanels(){
    let wrap = document.getElementById('gbPlanSummaryPanels');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'gbPlanSummaryPanels';
      greatBooksProgressGrid.before(wrap);
    }
    const all = {gateway:summary(state,subset('all','gateway')),greatbooks:summary(state,subset('all','greatbooks')),total:summary(state,subset())};
    wrap.innerHTML = `<div class="gbPlanOverall"><div><h3>Entire Plan</h3><p>387 reading assignments across Parts I-IV.</p></div><div class="gbPlanStats">${statBlock('Gateway',all.gateway)}${statBlock('Great Books',all.greatbooks)}${statBlock('Total',all.total)}</div></div>` +
      ['I','II','III','IV'].map(part=>{const s=stageSummary(state,part);return `<div class="gbPlanStage"><div class="gbPlanStageTitle"><strong>Part ${part}</strong><span>${esc(plan.l[part])}</span></div><div class="gbPlanStats">${statBlock('Gateway',s.gateway)}${statBlock('Great Books',s.greatbooks)}${statBlock('Stage total',s.total)}</div></div>`}).join('');
  }

  function ensureControls(){
    let controls = document.getElementById('gbPlanFilters');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'gbPlanFilters';
      controls.innerHTML = `<label>Stage<select id="gbPlanPartFilter"><option value="all">All stages</option><option value="I">Part I — 7th & 8th</option><option value="II">Part II — 9th & 10th</option><option value="III">Part III — 11th & 12th</option><option value="IV">Part IV — College</option></select></label><label>Collection<select id="gbPlanCollectionFilter"><option value="all">Gateway + Great Books</option><option value="gateway">Gateway to the Great Books</option><option value="greatbooks">Great Books of the Western World</option></select></label>`;
      greatBooksProgressGrid.before(controls);
      controls.querySelector('#gbPlanPartFilter').onchange = e => {state.books.greatBooks.planFilters.part=e.target.value;save();renderGreatBooks();};
      controls.querySelector('#gbPlanCollectionFilter').onchange = e => {state.books.greatBooks.planFilters.collection=e.target.value;save();renderGreatBooks();};
    }
    controls.querySelector('#gbPlanPartFilter').value = state.books.greatBooks.planFilters.part || 'all';
    controls.querySelector('#gbPlanCollectionFilter').value = state.books.greatBooks.planFilters.collection || 'all';
  }

  function gridHtml(app,dates,editable,q=''){
    const filters = app.books.greatBooks.planFilters || {part:'all',collection:'all'};
    const query = String(q||'').trim().toLowerCase();
    const items = subset(filters.part,filters.collection).filter(x => !query || [x.title,x.author,x.stageLabel,x.collectionLabel].join(' ').toLowerCase().includes(query));
    let html = `<table class="gbProgressTable gbPlanTable"><thead><tr><th class="gbMeta gbStage">Stage</th><th class="gbMeta gbCollection">Collection</th><th class="gbMeta gbVol">Vol.</th><th class="gbMeta gbAuthor">Author</th><th class="gbMeta gbTitle">Reading</th><th class="gbMeta gbPages">Assigned pages</th>${dates.map(d=>`<th class="${d===todayISO()?'gbTodayHead':''}">${new Date(d+'T00:00:00').toLocaleDateString(undefined,{month:'numeric',day:'numeric'})}</th>`).join('')}<th>%</th><th>Complete</th></tr></thead><tbody>`;
    let lastGroup='';
    items.forEach(item=>{
      const groupKey = `${item.part}-${item.collection}`;
      if (groupKey !== lastGroup) {
        lastGroup = groupKey;
        html += `<tr class="gbPlanGroupRow"><td colspan="${8+dates.length}"><strong>Part ${esc(item.part)} — ${esc(item.stageLabel)}</strong><span>${esc(item.collectionLabel)}</span></td></tr>`;
      }
      const pct=itemPercent(app,item), logs=app.books.greatBooks.pageByDate[item.id]||{}, manual=manuallyComplete(app,item), pageComplete=!manual && pct>=100;
      const pageInputAllowed = item.ranges && item.ranges.length;
      html += `<tr class="${pct>=100?'gbCompleteRow':''}"><td class="gbMeta gbStage">${esc(item.part)}</td><td class="gbMeta gbCollection">${item.collection==='gateway'?'Gateway':'Great Books'}</td><td class="gbMeta gbVol">${esc(item.volume)}</td><td class="gbMeta gbAuthor">${esc(item.author)}</td><td class="gbMeta gbTitle"><strong>${esc(item.title)}</strong><div class="small">Plan p. ${esc(item.sourcePlanPage)}</div>${editable?`<button data-gb-shared="${esc(item.id)}">Text/Pages</button>`:''}</td><td class="gbMeta gbPages">${esc(item.pageNumbers)}<br><span class="small">${totalPages(item)?totalPages(item)+' assigned pages':'No page range'}</span></td>`;
      html += dates.map(d=>{const v=logs[d]??'';if(!editable)return `<td>${v?Number(v):'<span class="small">—</span>'}</td>`;if(!pageInputAllowed)return `<td><span class="gbNoPageInput">—</span></td>`;return `<td><input class="gbPageInput" type="number" min="${item.firstPage}" max="${item.lastPage}" placeholder="${pageAt(app,item,d)||''}" value="${v}" data-gb-page="${esc(item.id)}" data-gb-date="${d}" aria-label="${esc(item.title)} current page on ${d}"></td>`;}).join('');
      html += `<td class="gbRowPct"><strong>${pct}%</strong>${progressBar(pct)}</td><td><button class="gbCompleteBtn ${manual?'manualComplete':pageComplete?'pageComplete':''}" data-gb-complete="${esc(item.id)}" ${pageComplete?'disabled':''}>${manual?'✓ Complete':pageComplete?'✓ Complete':'Mark complete'}</button></td></tr>`;
    });
    return html + '</tbody></table>';
  }

  greatBooksSummary = function(app){
    ensureGBState();
    const s = summary(app,newCatalog);
    const start=addDaysISO(todayISO(),-14),before=addDaysISO(start,-1);
    const gained=newCatalog.reduce((sum,x)=>sum+Math.max(0,pagesRead(app,x)-pagesRead(app,x,before)),0);
    const pace=gained/14,days=pace>0?Math.ceil(s.leftPages/pace):null;
    return {count:s.count,total:s.knownPages,read:s.readPages,left:s.leftPages,pct:s.pct,pace,days,finish:days!==null?addDaysISO(todayISO(),days):null};
  };
  greatBooksGridHtml = gridHtml;

  renderGreatBooks = function(){
    if(!greatBooksProgressGrid)return;
    ensureGBState();
    ensureControls();
    renderSummaryPanels();
    const days=Number(greatBooksDays?.value)||14,dates=familyDateList(days),m=greatBooksSummary(state);
    const overall=summary(state,newCatalog);
    gbReadingCount.textContent=m.count;
    gbTotalPages.textContent=m.total.toLocaleString();
    gbPagesRead.textContent=m.read.toLocaleString();
    gbPagesLeft.textContent=m.left.toLocaleString();
    gbPercentDone.textContent=overall.pct+'%';
    gbCurrentPace.textContent=m.pace.toFixed(1)+'/day';
    gbDaysLeft.textContent=m.days===null?'—':m.days;
    gbFinishDate.textContent=m.finish?'Finish '+new Date(m.finish+'T00:00:00').toLocaleDateString():'Enter pages to calculate';
    greatBooksProgressGrid.innerHTML=gridHtml(state,dates,true,greatBooksSearch?.value||'');

    greatBooksProgressGrid.querySelectorAll('[data-gb-page]').forEach(input=>input.onchange=()=>{
      const item=newCatalog.find(x=>x.id===input.dataset.gbPage);if(!item)return;
      const raw=input.value.trim(),gb=state.books.greatBooks;gb.pageByDate[item.id]=gb.pageByDate[item.id]||{};
      if(!raw)delete gb.pageByDate[item.id][input.dataset.gbDate];
      else gb.pageByDate[item.id][input.dataset.gbDate]=Math.max(Number(item.firstPage)||0,Math.min(Number(item.lastPage)||99999,Number(raw)||0));
      const auto=pagesRead(state,item)>=totalPages(item)&&totalPages(item)>0;
      if(auto && !gb.completedIds.includes(item.id)) gb.completedIds.push(item.id);
      save();renderGreatBooks();
    });
    greatBooksProgressGrid.querySelectorAll('[data-gb-complete]').forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.gbComplete,gb=state.books.greatBooks;
      if(gb.completedIds.includes(id))gb.completedIds=gb.completedIds.filter(x=>x!==id);else gb.completedIds=[...new Set([...gb.completedIds,id])];
      save();renderGreatBooks();
    });
    greatBooksProgressGrid.querySelectorAll('[data-gb-shared]').forEach(b=>b.onclick=()=>{state.books.greatBooks.selectedId=b.dataset.gbShared;save();renderGreatBooks();refreshGreatBookShared();});
    const sel=newCatalog.find(x=>x.id===state.books.greatBooks.selectedId);greatBookSelectedLabel.textContent=sel?`${sel.author} — ${sel.title}`:'Choose Text/Pages beside a reading.';
  };

  function relabelPage(){
    const tab=document.getElementById('tab-greatbooks');
    const header=tab?.querySelector(':scope > .row > div > h2');
    const sub=tab?.querySelector(':scope > .row > div > .sub');
    if(header)header.textContent='Plan of Graded Reading';
    if(sub)sub.textContent='Parts I-IV: Gateway to the Great Books and Great Books of the Western World. Enter the current printed page, or mark a reading complete.';
    const notice=tab?.querySelector('.cloudNotice');
    if(notice)notice.textContent='Percentages include partial progress for readings with page ranges. Readings without a stated range count as 0% until you use Mark complete. Stage and plan percentages average the progress of each assigned reading.';
  }

  ensureGBState();
  relabelPage();
  renderGreatBooks();
})();
