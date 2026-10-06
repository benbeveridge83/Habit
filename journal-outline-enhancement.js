(() => {
  const LEGACY_IDEAS_KEY = 'habit-journal-outline-ideas-v1';
  const settings = document.getElementById('journalTopicSettings');
  const workspace = document.getElementById('journalWorkspace');
  const settingsButton = document.getElementById('journalTopicSettingsBtn');
  const doneButton = document.getElementById('journalTopicSettingsDoneBtn');
  const guide = document.getElementById('journalTopicGuide');
  if (!settings || !guide) return;

  let legacyIdeas = {};
  try { legacyIdeas = JSON.parse(localStorage.getItem(LEGACY_IDEAS_KEY) || '{}') || {}; } catch (_) {}

  const editor = document.createElement('div');
  editor.className = 'journalIdeaEditor';
  editor.innerHTML = `
    <label class="journalIdeaTitle" for="journalHeadingIdea">Prompt for this topic</label>
    <p class="journalIdeaHelp">Questions or reminders to guide you. They will appear on the topic's card when you journal.</p>
    <textarea id="journalHeadingIdea" placeholder="What happened today? What am I grateful for? What needs attention?" disabled></textarea>
    <div id="journalIdeaSaveStatus" role="status">Select a topic above.</div>`;
  journalOutlineTree.after(editor);
  const promptInput = editor.querySelector('textarea');
  const promptStatus = editor.querySelector('#journalIdeaSaveStatus');

  function setSettingsOpen(open) {
    if (journalRecordingBusy) return;
    settings.hidden = !open;
    workspace.hidden = open;
    settingsButton.setAttribute('aria-expanded', String(open));
    if (open) {
      renderJournalOutline();
      doneButton.focus();
    } else {
      renderJournalTopicGuide();
      settingsButton.focus();
    }
  }
  settingsButton.addEventListener('click', () => setSettingsOpen(settings.hidden));
  doneButton.addEventListener('click', () => setSettingsOpen(false));
  settings.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); setSettingsOpen(false); }
  });

  function updatePromptEditor() {
    const heading = journalHeadingById(state.journal.selectedHeadingId);
    promptInput.disabled = !heading;
    promptInput.dataset.headingId = heading?.id || '';
    if (document.activeElement !== promptInput) promptInput.value = heading?.prompt || '';
    promptStatus.textContent = heading ? `Prompt for “${journalHeadingPath(heading.id)}”` : 'Select a topic above.';
  }
  promptInput.addEventListener('input', () => {
    const heading = journalHeadingById(promptInput.dataset.headingId);
    if (!heading) return;
    heading.prompt = promptInput.value;
    promptStatus.textContent = save() ? 'Saved' : 'Could not save. Please free up browser storage and try again.';
    renderGuideCards();
  });

  function renderGuideCards() {
    const focus = document.activeElement;
    const focusTopic = focus?.dataset?.journalTopic;
    const focusCovered = focus?.dataset?.journalCovered;
    const covered = new Set(journalDraftCoveredIds);
    const topics = state.journal.headings || [];
    const count = topics.filter(heading => covered.has(heading.id)).length;
    document.getElementById('journalTopicProgress').textContent = `${count} of ${topics.length} topics covered`;
    const progress = document.getElementById('journalTopicProgressBar');
    progress.max = topics.length || 1;
    progress.value = count;
    guide.replaceChildren();

    if (!topics.length) {
      const empty = document.createElement('div');
      empty.className = 'journalTopicsEmpty';
      const title = document.createElement('strong');
      title.textContent = 'What would you like to reflect on?';
      const help = document.createElement('p');
      help.textContent = 'Add your journal topics in settings. You can still speak or write freely now.';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Add journal topics';
      button.className = 'primary';
      button.disabled = journalRecordingBusy;
      button.onclick = () => setSettingsOpen(true);
      empty.append(title, help, button);
      guide.append(empty);
      return;
    }

    const visited = new Set();
    const addTopic = (heading, group, depth) => {
      if (visited.has(heading.id)) return;
      visited.add(heading.id);
      const isCovered = covered.has(heading.id);
      const selected = state.journal.selectedHeadingId === heading.id;
      const fullTitle = journalHeadingPath(heading.id);
      const row = document.createElement('div');
      row.className = 'journalTopicCard' + (isCovered ? ' isCovered' : '') + (selected ? ' isCurrent' : '');
      row.style.setProperty('--topic-depth', Math.min(depth, 3));
      const choose = document.createElement('button');
      choose.type = 'button';
      choose.className = 'journalTopicChoose';
      choose.dataset.journalTopic = heading.id;
      choose.setAttribute('aria-pressed', String(selected));
      choose.setAttribute('aria-label', `Talk about ${fullTitle}`);
      choose.title = `Choose ${fullTitle} for your next words`;
      const name = document.createElement('strong');
      name.textContent = heading.title;
      choose.append(name);
      if (heading.prompt) {
        const prompt = document.createElement('span');
        prompt.className = 'journalTopicPrompt';
        prompt.textContent = heading.prompt;
        choose.append(prompt);
      }
      const status = document.createElement('span');
      status.className = 'journalTopicStatus';
      status.textContent = selected ? '● Current topic' : depth ? `In ${journalHeadingPath(heading.parentId)}` : 'Choose topic';
      choose.append(status);
      choose.onclick = () => selectJournalHeading(heading.id);

      const check = document.createElement('button');
      check.type = 'button';
      check.className = 'journalTopicCovered';
      check.dataset.journalCovered = heading.id;
      check.setAttribute('aria-pressed', String(isCovered));
      check.setAttribute('aria-label', `Mark ${fullTitle} as ${isCovered ? 'not covered' : 'covered'}`);
      check.title = isCovered ? 'Undo covered' : 'I have talked or written about this topic';
      check.textContent = isCovered ? '✓ Covered' : '○ Covered';
      check.onclick = () => {
        journalDraftCoveredIds = isCovered ? journalDraftCoveredIds.filter(id => id !== heading.id) : [...journalDraftCoveredIds, heading.id];
        renderGuideCards();
      };
      row.append(choose, check);
      group.append(row);
      journalHeadingChildren(heading.id).forEach(child => addTopic(child, group, depth + 1));
    };
    const addGroup = heading => {
      const group = document.createElement('div');
      group.className = 'journalTopicGroup';
      addTopic(heading, group, 0);
      guide.append(group);
    };
    journalHeadingChildren(null).forEach(addGroup);
    topics.filter(heading => !visited.has(heading.id)).forEach(heading => { if (!visited.has(heading.id)) addGroup(heading); });
    // Preserve keyboard focus and scrolling when a topic/checkmark is updated.
    if (focusTopic || focusCovered) {
      const next = [...guide.querySelectorAll('button')].find(button => focusTopic ? button.dataset.journalTopic === focusTopic : button.dataset.journalCovered === focusCovered);
      next?.focus({ preventScroll: true });
    }
  }

  function renderJournalTopicGuide() {
    // Keep existing browser-retained ideas, then store prompts with their stable
    // heading IDs using the journal's normal account save/sync path.
    let migrated = false;
    (state.journal.headings || []).forEach(heading => {
      if (!Object.prototype.hasOwnProperty.call(heading, 'prompt') && typeof legacyIdeas[heading.title] === 'string') {
        heading.prompt = legacyIdeas[heading.title];
        migrated = true;
      }
    });
    if (migrated) save();
    renderGuideCards();
    updatePromptEditor();
  }
  window.renderJournalTopicGuide = renderJournalTopicGuide;
  renderJournalTopicGuide();
})();
