function toggleFocusInPage() {
  const STYLE_ID = '__glpi_focus_css__';
  const LISTENER = '__glpi_focus_ctx_listener__';
  const CLICKER = '__glpi_focus_click_listener__';
  const PANEL_ID = '__glpi_focus_panel__';

  if (document.getElementById(STYLE_ID)) {
    document.getElementById(STYLE_ID).remove();

    if (window[LISTENER]) {
      document.removeEventListener('contextmenu', window[LISTENER]);
      delete window[LISTENER];
    }
    if (window[CLICKER]) {
      document.removeEventListener('mousedown', window[CLICKER], true);
      delete window[CLICKER];
    }
    closePanel();
    return;
  }

  fetch(chrome.runtime.getURL('style.css'))
    .then(r => r.text())
    .then(css => {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);

      const ctxHandler = e => {
        e.preventDefault();
        if (document.getElementById(PANEL_ID)) {
          closePanel();
        } else {
          buildPanel(e.clientX, e.clientY);     
        }
      };
      document.addEventListener('contextmenu', ctxHandler);
      window[LISTENER] = ctxHandler;
    })
    .catch(console.error);

  function buildPanel(clickX, clickY) {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.dataset.ready = '0';
    document.body.appendChild(panel);

    const prefixes = [
      'requester_', 'observer_', 'assign_',
      'status_', 'priority_', 'slas_id_ttr_'
    ];

    const restores = [];

    prefixes.forEach(pref => {
      const label = document.querySelector(`label[for^="${pref}"]`);
      if (!label) return;
      const field = label.closest('div.form-field');
      if (!field) return;

      const placeholder = document.createComment('__focus_placeholder__');
      field.parentNode.insertBefore(placeholder, field);
      panel.appendChild(field);
      restores.push({ field, placeholder });
    });

    panel.__restores = restores;

    panel.style.left = `${clickX}px`;
    panel.style.top = `${clickY}px`;

    requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      let left = rect.left;
      let top = rect.top;
      if (rect.right > innerWidth) left = innerWidth - rect.width - 8;
      if (rect.bottom > innerHeight) top = innerHeight - rect.height - 8;
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.dataset.ready = '1';
    });

    const outsideHandler = ev => {
      const p = document.getElementById(PANEL_ID);
      if (!p || p.contains(ev.target)) return;
      closePanel();
    };
    document.addEventListener('mousedown', outsideHandler, true);
    window[CLICKER] = outsideHandler;
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    (panel.__restores || []).forEach(({ field, placeholder }) => {
      if (placeholder.parentNode) {
        placeholder.parentNode.insertBefore(field, placeholder);
        placeholder.remove();
      }
    });

    panel.remove();

    if (window[CLICKER]) {
      document.removeEventListener('mousedown', window[CLICKER], true);
      delete window[CLICKER];
    }
  }
}

function runToggle(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: toggleFocusInPage
  });
}

chrome.commands.onCommand.addListener((cmd, tab) => {
  if (cmd === 'toggle-focus' && tab?.id) runToggle(tab.id);
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.command !== 'toggle-focus') return;
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) runToggle(tabs[0].id);
  });
});