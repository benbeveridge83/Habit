(() => {
  const STYLE_ID = 'todo-inline-controls-style';
  const INSTALLED = 'todoInlineControlsInstalled';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #todoList .entry[data-inline-todo-controls="true"] {
        cursor: default;
      }
      #todoList .entry[data-inline-todo-controls="true"]:hover {
        border-color: #cbd5e1;
      }
      #todoList .todoInlineActions {
        display: flex;
        align-items: center;
        gap: 7px;
        flex-wrap: wrap;
        margin-top: 9px;
        padding-top: 9px;
        border-top: 1px solid var(--line, #e5e7eb);
      }
      #todoList .todoCompleteControl {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 34px;
        padding: 6px 10px;
        border: 1px solid rgba(22, 163, 74, .32);
        border-radius: 10px;
        background: rgba(22, 163, 74, .06);
        color: #166534;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        user-select: none;
      }
      #todoList .todoCompleteControl input {
        width: 17px;
        height: 17px;
        min-height: 0 !important;
        margin: 0;
        padding: 0;
        accent-color: #16a34a;
        cursor: pointer;
      }
      #todoList .todoInlineBtn {
        min-height: 34px;
        padding: 6px 9px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 650;
        white-space: nowrap;
      }
      #todoList .todoInlineBtn.todoDeleteBtn {
        color: #b91c1c;
        border-color: rgba(239, 68, 68, .28);
        background: rgba(239, 68, 68, .04);
      }
      #todoList .todoInlineStatus {
        margin-top: 7px;
      }
      @media (max-width: 640px) {
        #todoList .todoInlineActions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }
        #todoList .todoCompleteControl,
        #todoList .todoInlineBtn {
          width: 100%;
          justify-content: center;
          text-align: center;
        }
        #todoList .todoCompleteControl {
          grid-column: 1 / -1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function runLegacyAction(card, actionNumber) {
    const handler = card.__todoLegacyHandler;
    if (typeof handler !== 'function') return;

    const nativePrompt = window.prompt;
    let suppliedAction = false;
    window.prompt = function(message, defaultValue) {
      if (!suppliedAction && typeof message === 'string' && message.includes('Manage To')) {
        suppliedAction = true;
        return String(actionNumber);
      }
      return nativePrompt.call(window, message, defaultValue);
    };

    try {
      handler.call(card);
    } finally {
      window.prompt = nativePrompt;
    }
  }

  function makeButton(label, title, actionNumber, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `todoInlineBtn ${extraClass}`.trim();
    button.textContent = label;
    button.title = title;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const card = button.closest('#todoList .entry');
      if (card) runLegacyAction(card, actionNumber);
    });
    return button;
  }

  function decorateCard(card) {
    if (!(card instanceof HTMLElement)) return;
    if (card.dataset.inlineTodoControls === 'true') return;
    if (typeof card.onclick !== 'function') return;

    card.__todoLegacyHandler = card.onclick;
    card.onclick = null;
    card.dataset.inlineTodoControls = 'true';

    const statusLine = [...card.querySelectorAll('p.small')].find((p) =>
      /click to manage/i.test(p.textContent || '')
    );
    const completed = /completed/i.test(statusLine?.textContent || '') && !/pending/i.test(statusLine?.textContent || '');
    if (statusLine) {
      statusLine.textContent = completed ? 'Completed' : 'Pending';
      statusLine.classList.add('todoInlineStatus');
    }

    const actions = document.createElement('div');
    actions.className = 'todoInlineActions';

    const completeLabel = document.createElement('label');
    completeLabel.className = 'todoCompleteControl';
    completeLabel.title = completed ? 'Mark this to-do pending' : 'Mark this to-do complete';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    checkbox.setAttribute('aria-label', completed ? 'Mark pending' : 'Mark complete');
    checkbox.addEventListener('click', (event) => event.stopPropagation());
    checkbox.addEventListener('change', (event) => {
      event.preventDefault();
      event.stopPropagation();
      runLegacyAction(card, 1);
    });

    const completeText = document.createElement('span');
    completeText.textContent = completed ? 'Completed' : 'Mark complete';
    completeLabel.append(checkbox, completeText);

    actions.append(
      completeLabel,
      makeButton('✎ Rename', 'Rename this to-do', 2),
      makeButton('↪ Move', 'Move this to-do to another Life branch', 3),
      makeButton('🏷 Categories', 'Change this to-do’s categories', 4),
      makeButton('🗑 Delete', 'Delete this to-do', 5, 'todoDeleteBtn')
    );

    card.appendChild(actions);
  }

  function decorateTodoCards() {
    const list = document.getElementById('todoList');
    if (!list) return;
    [...list.children].forEach(decorateCard);
  }

  function install() {
    const list = document.getElementById('todoList');
    if (!list || list.dataset[INSTALLED]) return;
    list.dataset[INSTALLED] = 'true';
    installStyles();
    decorateTodoCards();

    const observer = new MutationObserver(() => {
      requestAnimationFrame(decorateTodoCards);
    });
    observer.observe(list, { childList: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
