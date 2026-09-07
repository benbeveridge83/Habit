(() => {
  const STORAGE_KEY = 'habit-journal-outline-ideas-v1';
  let ideaMap = {};
  let selectedTitle = '';
  let selectedKey = '';
  let saveTimer = null;
  let observer = null;

  function loadIdeas(){
    try{ ideaMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch(_){ ideaMap = {}; }
  }

  function saveIdeas(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(ideaMap)); }
    catch(_){ }
  }

  function normalizedPathFromRow(row){
    const strong = row.querySelector('strong');
    return (strong?.textContent || '').trim();
  }

  function ensureEditor(){
    const tree = document.getElementById('journalOutlineTree');
    if(!tree) return null;
    const panel = tree.closest('.journalPanel');
    if(!panel) return null;
    let editor = panel.querySelector('.journalIdeaEditor');
    if(editor) return editor;

    editor = document.createElement('div');
    editor.className = 'journalIdeaEditor';
    editor.innerHTML = `
      <div class="journalIdeaTitle">What to write about</div>
      <p class="journalIdeaHelp">Select a structure row, then keep notes, prompts, questions, or ideas for what belongs under that heading.</p>
      <textarea id="journalHeadingIdea" placeholder="Examples: What happened today? What am I grateful for? What needs attention? Questions to think through…" disabled></textarea>
      <div id="journalIdeaSaveStatus">Select a row above.</div>
    `;
    tree.after(editor);

    const textarea = editor.querySelector('#journalHeadingIdea');
    textarea.addEventListener('input', () => {
      if(!selectedKey) return;
      ideaMap[selectedKey] = textarea.value;
      clearTimeout(saveTimer);
      const status = editor.querySelector('#journalIdeaSaveStatus');
      if(status) status.textContent = 'Saving…';
      saveTimer = setTimeout(() => {
        saveIdeas();
        if(status) status.textContent = 'Saved';
        decorateRows();
      }, 250);
    });
    return editor;
  }

  function selectRow(row){
    const title = normalizedPathFromRow(row);
    if(!title) return;
    selectedTitle = title;
    selectedKey = title;
    const editor = ensureEditor();
    if(!editor) return;
    const textarea = editor.querySelector('#journalHeadingIdea');
    const status = editor.querySelector('#journalIdeaSaveStatus');
    textarea.disabled = false;
    textarea.value = ideaMap[selectedKey] || '';
    if(status) status.textContent = `Ideas for “${selectedTitle}”`;
  }

  function decorateRows(){
    const tree = document.getElementById('journalOutlineTree');
    if(!tree) return;
    const rows = [...tree.querySelectorAll('.journalOutlineRow')];
    rows.forEach(row => {
      if(row.dataset.ideaDecorated === 'true') return;
      row.dataset.ideaDecorated = 'true';
      const title = normalizedPathFromRow(row);
      const strong = row.querySelector('strong');
      if(strong && !strong.parentElement?.classList.contains('journalOutlineRowText')){
        const wrap = document.createElement('div');
        wrap.className = 'journalOutlineRowText';
        strong.replaceWith(wrap);
        wrap.appendChild(strong);
        const preview = document.createElement('span');
        preview.className = 'journalIdeaPreview';
        preview.textContent = ideaMap[title] || '';
        if(!preview.textContent) preview.hidden = true;
        wrap.appendChild(preview);
      }else{
        const preview = row.querySelector('.journalIdeaPreview');
        if(preview){
          preview.textContent = ideaMap[title] || '';
          preview.hidden = !preview.textContent;
        }
      }

      row.addEventListener('click', () => {
        requestAnimationFrame(() => selectRow(row));
      });
    });

    const selected = rows.find(r => r.classList.contains('selected'));
    if(selected && !selectedKey) selectRow(selected);
  }

  function install(){
    loadIdeas();
    const tree = document.getElementById('journalOutlineTree');
    if(!tree) return;
    ensureEditor();
    decorateRows();
    observer = new MutationObserver(() => requestAnimationFrame(decorateRows));
    observer.observe(tree, { childList:true, subtree:false });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
