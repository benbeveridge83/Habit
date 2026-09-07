(() => {
  const VERSION = '20260907-prioritycenter1';
  let draggedKey = null;

  function uid() {
    try { return cryptoId(); } catch (_) {
      return `priority-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    }
  }

  function ensureState() {
    state.priorityCenter = state.priorityCenter || {};
    if (!Array.isArray(state.priorityCenter.order)) state.priorityCenter.order = [];
    if (!Array.isArray(state.priorityCenter.items)) state.priorityCenter.items = [];
  }

  function esc(value) {
    try { return escapeHtml(String(value ?? '')); }
    catch (_) {
      return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    }
  }

  function itemKey(type, id) { return `${type}:${id}`; }
  function splitKey(key) {
    const i = String(key).indexOf(':');
    return i < 0 ? {type:'',id:String(key)} : {type:String(key).slice(0,i), id:String(key).slice(i+1)};
  }

  function habitGroupName(task) {
    const groups = state.habits?.groups || [];
    const g = groups.find(x => String(x.id) === String(task.groupId));
    return g?.name || task.location || 'Habit';
  }

  function goalPath(goal) {
    const names = [];
    let g = goal;
    let guard = 0;
    while (g && guard++ < 40) {
      names.unshift(g.title || 'Goal');
      if (!g.parentId) break;
      g = (state.goals?.items || []).find(x => String(x.id) === String(g.parentId));
    }
    return names.join(' › ');
  }

  function candidates() {
    ensureState();
    const rows = [];

    (state.habits?.tasks || []).forEach(task => {
      if (task && task.active !== false) {
        rows.push({
          key:itemKey('habit',task.id), type:'habit', id:task.id,
          title:task.name || 'Habit', meta:habitGroupName(task), source:'Habit'
        });
      }
    });

    (state.todo?.items || []).forEach(todo => {
      if (todo && !todo.completedAt) {
        rows.push({
          key:itemKey('todo',todo.id), type:'todo', id:todo.id,
          title:todo.title || 'To-do', meta:'Pending to-do', source:'To-Do'
        });
      }
    });

    (state.goals?.items || []).forEach(goal => {
      if (goal && !goal.completed) {
        rows.push({
          key:itemKey('goal',goal.id), type:'goal', id:goal.id,
          title:goal.title || 'Goal', meta:goalPath(goal), source:'Goal'
        });
      }
    });

    (state.priorityCenter.items || []).forEach(item => {
      if (item && !item.completedAt) {
        rows.push({
          key:itemKey('item',item.id), type:'item', id:item.id,
          title:item.title || 'Item', meta:'Standalone priority item', source:'Item'
        });
      }
    });

    return rows;
  }

  function syncOrder() {
    ensureState();
    const rows = candidates();
    const valid = new Set(rows.map(r => r.key));
    const existing = state.priorityCenter.order.filter(k => valid.has(k));

    // Preserve the old habit ranking when upgrading for the first time.
    if (!state.priorityCenter.migratedHabitOrder) {
      const oldHabitOrder = Array.isArray(state.habits?.priorityOrder) ? state.habits.priorityOrder : [];
      const oldKeys = oldHabitOrder.map(id => itemKey('habit',id)).filter(k => valid.has(k));
      const nonHabitExisting = existing.filter(k => !k.startsWith('habit:'));
      state.priorityCenter.order = [...oldKeys, ...nonHabitExisting];
      state.priorityCenter.migratedHabitOrder = true;
    } else {
      state.priorityCenter.order = existing;
    }

    const inOrder = new Set(state.priorityCenter.order);
    rows.forEach(r => { if (!inOrder.has(r.key)) state.priorityCenter.order.push(r.key); });

    // Keep the legacy habit-only order synchronized so existing XP bonus logic continues to work.
    const activeHabitIds = new Set((state.habits?.tasks || []).filter(t => t && t.active !== false).map(t => String(t.id)));
    const rankedHabitIds = state.priorityCenter.order
      .map(splitKey)
      .filter(x => x.type === 'habit' && activeHabitIds.has(String(x.id)))
      .map(x => x.id);
    const rankedSet = new Set(rankedHabitIds.map(String));
    (state.habits?.tasks || []).forEach(t => {
      if (t && t.active !== false && !rankedSet.has(String(t.id))) rankedHabitIds.push(t.id);
    });
    if (state.habits) state.habits.priorityOrder = rankedHabitIds;
  }

  function rowForKey(key) {
    return candidates().find(r => r.key === key) || null;
  }

  function moveKey(key, delta) {
    syncOrder();
    const arr = state.priorityCenter.order;
    const from = arr.indexOf(key);
    if (from < 0) return;
    const to = Math.max(0, Math.min(arr.length - 1, from + delta));
    if (to === from) return;
    arr.splice(from,1);
    arr.splice(to,0,key);
    syncOrder();
    save();
    renderPriorities();
  }

  function openSource(row) {
    if (!row) return;
    if (row.type === 'habit') {
      showTab('habits');
      try { window.__editTask?.(row.id); } catch (_) {}
      return;
    }
    if (row.type === 'todo') { showTab('todo'); return; }
    if (row.type === 'goal') {
      showTab('goals');
      try { selectGoal?.(row.id); } catch (_) {}
      return;
    }
    if (row.type === 'item') { showTab('items'); }
  }

  function renderUnifiedPriorities() {
    const list = document.getElementById('priorityList');
    if (!list) return;
    syncOrder();
    const map = new Map(candidates().map(r => [r.key,r]));
    const orderedRows = state.priorityCenter.order.map(k => map.get(k)).filter(Boolean);

    const parentCard = list.closest('.card');
    if (parentCard && !parentCard.querySelector('.priorityIntroBar')) {
      const heading = parentCard.querySelector('h2');
      if (heading) heading.textContent = 'Rank everything together';
      const intro = document.createElement('div');
      intro.className = 'priorityIntroBar';
      intro.innerHTML = `
        <div class="prioritySourceLegend">
          <span class="prioritySourceBadge habit">Habit</span>
          <span class="prioritySourceBadge todo">To-Do</span>
          <span class="prioritySourceBadge goal">Goal</span>
          <span class="prioritySourceBadge item">Item</span>
        </div>
        <button type="button" class="primary" id="priorityQuickAddItemBtn">+ New item</button>`;
      list.before(intro);
      intro.querySelector('#priorityQuickAddItemBtn')?.addEventListener('click', () => showTab('items'));
      const helper = parentCard.querySelector('.small');
      if (helper) helper.textContent = 'Drag rows, or use the ↑ and ↓ buttons. Your habits, to-dos, goals, and standalone items all share one priority order.';
    }

    const topSub = document.querySelector('#tab-priorities > .sub');
    if (topSub) topSub.textContent = 'Prioritize habits, to-do items, goals, and standalone items in one list.';

    list.innerHTML = '';
    if (!orderedRows.length) {
      list.innerHTML = '<div class="priorityEmpty">Nothing is waiting to be prioritized. Add a habit, to-do, goal, or standalone item.</div>';
      return;
    }

    orderedRows.forEach((row, index) => {
      const el = document.createElement('div');
      el.className = 'priorityUnifiedRow';
      el.draggable = true;
      el.dataset.priorityKey = row.key;
      el.innerHTML = `
        <div class="priorityUnifiedMove">
          <button type="button" data-priority-up="${esc(row.key)}" aria-label="Move ${esc(row.title)} up">↑</button>
          <button type="button" data-priority-down="${esc(row.key)}" aria-label="Move ${esc(row.title)} down">↓</button>
        </div>
        <div class="priorityUnifiedMain">
          <div class="priorityUnifiedTitle">
            <span class="priorityRank">${index + 1}</span>
            <strong>${esc(row.title)}</strong>
            <span class="prioritySourceBadge ${esc(row.type)}">${esc(row.source)}</span>
          </div>
          <div class="priorityUnifiedMeta">${esc(row.meta || '')}</div>
        </div>
        <button type="button" class="priorityOpenBtn" data-priority-open="${esc(row.key)}">Open</button>`;

      el.addEventListener('dragstart', () => { draggedKey = row.key; el.classList.add('dragging'); });
      el.addEventListener('dragend', () => { draggedKey = null; el.classList.remove('dragging'); });
      el.addEventListener('dragover', e => e.preventDefault());
      el.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedKey || draggedKey === row.key) return;
        const arr = state.priorityCenter.order;
        const from = arr.indexOf(draggedKey);
        const to = arr.indexOf(row.key);
        if (from < 0 || to < 0) return;
        arr.splice(from,1);
        arr.splice(to,0,draggedKey);
        syncOrder();
        save();
        renderUnifiedPriorities();
      });
      list.appendChild(el);
    });

    list.querySelectorAll('[data-priority-up]').forEach(btn => btn.addEventListener('click', () => moveKey(btn.dataset.priorityUp,-1)));
    list.querySelectorAll('[data-priority-down]').forEach(btn => btn.addEventListener('click', () => moveKey(btn.dataset.priorityDown,1)));
    list.querySelectorAll('[data-priority-open]').forEach(btn => btn.addEventListener('click', () => openSource(rowForKey(btn.dataset.priorityOpen))));
  }

  function createItemsTab() {
    if (document.getElementById('tab-items')) return document.getElementById('tab-items');
    const priorities = document.getElementById('tab-priorities');
    if (!priorities) return null;
    const tab = document.createElement('div');
    tab.id = 'tab-items';
    tab.className = 'hidden';
    tab.innerHTML = `
      <h2>Items</h2>
      <div class="sub">Create standalone things you want to rank on the Priorities page. They do not have to be a habit, to-do, or goal.</div>
      <div class="card">
        <h2>New item</h2>
        <form id="priorityItemForm" class="priorityItemsCreate">
          <input id="priorityItemInput" maxlength="180" placeholder="Type an item to prioritize…" autocomplete="off" />
          <button class="primary" type="submit">+ Add item</button>
        </form>
        <div id="priorityItemsList" class="list"></div>
      </div>`;
    priorities.after(tab);

    tab.querySelector('#priorityItemForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const input = tab.querySelector('#priorityItemInput');
      const title = (input?.value || '').trim();
      if (!title) { input?.focus(); return; }
      ensureState();
      const item = {id:uid(), title, completedAt:null, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()};
      state.priorityCenter.items.push(item);
      state.priorityCenter.order.push(itemKey('item',item.id));
      input.value = '';
      syncOrder();
      save();
      renderItemsPage();
      renderUnifiedPriorities();
      input.focus();
    });
    return tab;
  }

  function renderItemsPage() {
    ensureState();
    const list = document.getElementById('priorityItemsList');
    if (!list) return;
    const items = [...state.priorityCenter.items].sort((a,b) => {
      const ac = a.completedAt ? 1 : 0, bc = b.completedAt ? 1 : 0;
      if (ac !== bc) return ac - bc;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="priorityEmpty">No standalone items yet. Add one above and it will appear automatically on Priorities.</div>';
      return;
    }
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = `priorityItemRow${item.completedAt ? ' completed' : ''}`;
      row.innerHTML = `
        <input class="priorityItemCheck" type="checkbox" ${item.completedAt ? 'checked' : ''} aria-label="Mark ${esc(item.title)} complete" />
        <div class="priorityItemTitle${item.completedAt ? ' completed' : ''}">${esc(item.title)}</div>
        <div class="priorityItemActions">
          <button type="button" data-item-edit="${esc(item.id)}">Rename</button>
          <button type="button" class="danger" data-item-delete="${esc(item.id)}">Delete</button>
        </div>`;
      row.querySelector('.priorityItemCheck')?.addEventListener('change', e => {
        item.completedAt = e.target.checked ? new Date().toISOString() : null;
        item.updatedAt = new Date().toISOString();
        syncOrder();
        save();
        renderItemsPage();
        renderUnifiedPriorities();
      });
      list.appendChild(row);
    });

    list.querySelectorAll('[data-item-edit]').forEach(btn => btn.addEventListener('click', () => {
      const item = state.priorityCenter.items.find(x => String(x.id) === String(btn.dataset.itemEdit));
      if (!item) return;
      const next = prompt('Rename item:', item.title || '');
      if (next && next.trim()) {
        item.title = next.trim();
        item.updatedAt = new Date().toISOString();
        save(); renderItemsPage(); renderUnifiedPriorities();
      }
    }));
    list.querySelectorAll('[data-item-delete]').forEach(btn => btn.addEventListener('click', () => {
      const item = state.priorityCenter.items.find(x => String(x.id) === String(btn.dataset.itemDelete));
      if (!item) return;
      if (!confirm(`Delete “${item.title}”?`)) return;
      state.priorityCenter.items = state.priorityCenter.items.filter(x => String(x.id) !== String(item.id));
      state.priorityCenter.order = state.priorityCenter.order.filter(k => k !== itemKey('item',item.id));
      save(); renderItemsPage(); renderUnifiedPriorities();
    }));
  }

  function addNavigation() {
    if (!document.querySelector('.appSidebar [data-tab="items"]')) {
      const prioritiesBtn = document.querySelector('.appSidebar [data-tab="priorities"]');
      if (prioritiesBtn) {
        const btn = document.createElement('button');
        btn.className = 'globalNavBtn';
        btn.dataset.tab = 'items';
        btn.innerHTML = '<span class="navIcon">＋</span>Items';
        prioritiesBtn.after(btn);
        btn.addEventListener('click', () => showTab('items'));
      }
    }
    if (!document.querySelector('.globalNavGrid [data-tab="items"]')) {
      const prioritiesBtn = document.querySelector('.globalNavGrid [data-tab="priorities"]');
      if (prioritiesBtn) {
        const btn = document.createElement('button');
        btn.className = 'globalNavBtn';
        btn.dataset.tab = 'items';
        btn.textContent = 'Items';
        prioritiesBtn.after(btn);
        btn.addEventListener('click', () => showTab('items'));
      }
    }
  }

  function patchNavigation() {
    if (typeof showTab !== 'function' || showTab.__priorityCenterPatched) return;
    const original = showTab;
    const patched = function(name) {
      const requested = String(name || 'habits');
      original(requested);
      const itemsTab = document.getElementById('tab-items');
      if (itemsTab) itemsTab.classList.toggle('hidden', requested !== 'items');
      if (requested === 'items') {
        if (typeof currentSectionLabel !== 'undefined' && currentSectionLabel) currentSectionLabel.textContent = 'Items';
        document.querySelectorAll('[data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === 'items'));
        renderItemsPage();
      }
    };
    patched.__priorityCenterPatched = true;
    patched.__original = original;
    showTab = patched;
  }

  function patchPrioritiesRenderer() {
    if (typeof renderPriorities !== 'function' || renderPriorities.__priorityCenterPatched) return;
    const patched = function() { renderUnifiedPriorities(); };
    patched.__priorityCenterPatched = true;
    renderPriorities = patched;
  }

  function install() {
    ensureState();
    createItemsTab();
    addNavigation();
    patchNavigation();
    patchPrioritiesRenderer();
    syncOrder();
    save();
    renderUnifiedPriorities();
    renderItemsPage();

    // If cloud state arrives later and the app rerenders, keep the unified list current.
    const list = document.getElementById('priorityList');
    if (list && !list.dataset.priorityObserverInstalled) {
      list.dataset.priorityObserverInstalled = VERSION;
      const observer = new MutationObserver(() => {
        if (!list.querySelector('.priorityUnifiedRow') && !list.querySelector('.priorityEmpty')) {
          requestAnimationFrame(renderUnifiedPriorities);
        }
      });
      observer.observe(list,{childList:true});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
