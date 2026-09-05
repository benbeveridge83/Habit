(() => {
  const STORAGE_KEY = 'habit_week_grid_scroll_v1';
  let applyingScroll = false;
  let observer = null;

  function getView(){
    const select = document.getElementById('habitView');
    if(select && select.value) return select.value;
    if(document.getElementById('btnViewWeek')?.classList.contains('active')) return 'week';
    if(document.getElementById('btnViewMonth')?.classList.contains('active')) return 'month';
    return 'day';
  }

  function getViewDate(){
    return document.getElementById('viewDate')?.value || '';
  }

  function scrollStateKey(){
    return `${getView()}|${getViewDate()}`;
  }

  function readSavedScroll(){
    try{
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if(parsed && parsed.key === scrollStateKey() && Number.isFinite(Number(parsed.left))){
        return Math.max(0, Number(parsed.left));
      }
    }catch(_e){}
    return null;
  }

  function rememberScroll(wrap){
    if(!wrap || applyingScroll || getView() !== 'week') return;
    try{
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        key: scrollStateKey(),
        left: Math.max(0, wrap.scrollLeft || 0)
      }));
    }catch(_e){}
  }

  function todayIsFullyVisible(wrap){
    const today = wrap?.querySelector('thead th.today-highlight');
    if(!today) return true;
    const first = wrap.querySelector('thead th:first-child');
    const wrapRect = wrap.getBoundingClientRect();
    const todayRect = today.getBoundingClientRect();
    const stickyRight = first ? first.getBoundingClientRect().right : wrapRect.left;
    const visibleLeft = Math.max(wrapRect.left, stickyRight);
    return todayRect.left >= visibleLeft - 1 && todayRect.right <= wrapRect.right + 1;
  }

  function revealToday(wrap){
    const today = wrap?.querySelector('thead th.today-highlight');
    if(!today) return;
    const first = wrap.querySelector('thead th:first-child');
    const stickyWidth = first ? first.getBoundingClientRect().width : 0;
    const maxScroll = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    const desired = Math.max(0, today.offsetLeft - stickyWidth - 8);
    wrap.scrollLeft = Math.min(desired, maxScroll);
  }

  function wireGrid(wrap){
    if(!wrap || wrap.dataset.weekGridScrollWired === '1') return;
    wrap.dataset.weekGridScrollWired = '1';
    wrap.addEventListener('scroll', () => rememberScroll(wrap), {passive:true});

    requestAnimationFrame(() => {
      if(!document.documentElement.contains(wrap)) return;
      applyingScroll = true;
      try{
        const saved = readSavedScroll();
        if(saved !== null) wrap.scrollLeft = Math.min(saved, Math.max(0, wrap.scrollWidth - wrap.clientWidth));

        // In weekly view the current date should never start or rerender off-screen.
        if(getView() === 'week' && !todayIsFullyVisible(wrap)) revealToday(wrap);
      }finally{
        applyingScroll = false;
        rememberScroll(wrap);
      }
    });
  }

  function scan(){
    document.querySelectorAll('#habitsGridWrap .gridWrap.scrollX').forEach(wireGrid);
  }

  function clearSavedScroll(){
    try{ sessionStorage.removeItem(STORAGE_KEY); }catch(_e){}
  }

  function initialize(){
    scan();
    const gridHost = document.getElementById('habitsGridWrap');
    if(gridHost && !observer){
      observer = new MutationObserver(scan);
      observer.observe(gridHost, {childList:true, subtree:true});
    }

    // A deliberate switch to Week or jump to Today should establish a fresh
    // weekly default, while checkbox-driven rerenders retain the existing view.
    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('#btnViewWeek, #jumpTodayBtn');
      if(!button) return;
      clearSavedScroll();
      requestAnimationFrame(() => requestAnimationFrame(scan));
    }, true);

    document.addEventListener('change', (event) => {
      if(event.target?.id !== 'viewDate') return;
      clearSavedScroll();
      requestAnimationFrame(() => requestAnimationFrame(scan));
    }, true);

    window.addEventListener('resize', () => {
      requestAnimationFrame(() => {
        const wrap = document.querySelector('#habitsGridWrap .gridWrap.scrollX');
        if(getView() === 'week' && wrap && !todayIsFullyVisible(wrap)){
          applyingScroll = true;
          revealToday(wrap);
          applyingScroll = false;
          rememberScroll(wrap);
        }
      });
    }, {passive:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once:true});
  else initialize();
})();
