/**
 * GLPI Focus Mode
 *  – Injeta/Remove style.css
 *  – BOTÃO DIREITO abre painel com campos do ticket **sem perder funcionalidade**,
 *    pois os elementos reais são “emprestados” (movidos) para dentro do painel.
 *  – Clique esquerdo fora do painel (ou novo botão-direito) fecha e devolve
 *    tudo ao lugar original.
 */

function toggleFocusInPage() {
  const STYLE_ID = '__glpi_focus_css__';
  const LISTENER_KEY = '__glpi_focus_ctx_listener__';
  const CLICK_KEY = '__glpi_focus_click_listener__';
  const PANEL_ID = '__glpi_focus_panel__';

  /* ------------------------- DESATIVAR ------------------------- */
  if (document.getElementById(STYLE_ID)) {
    document.getElementById(STYLE_ID).remove();

    if (window[LISTENER_KEY]) {
      document.removeEventListener('contextmenu', window[LISTENER_KEY]);
      delete window[LISTENER_KEY];
    }
    if (window[CLICK_KEY]) {
      document.removeEventListener('mousedown', window[CLICK_KEY], true);
      delete window[CLICK_KEY];
    }

    closePanel();                                           // devolve campos
    return;
  }

  /* ------------------------- ATIVAR ---------------------------- */
  fetch(chrome.runtime.getURL('style.css'))
    .then(r => r.text())
    .then(css => {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = css;
      document.head.appendChild(s);

      /* listener BOTÃO DIREITO */
      const ctxHandler = e => {
        e.preventDefault();
        if (document.getElementById(PANEL_ID)) {
          closePanel();                                     // fecha se aberto
        } else {
          buildPanel(e.pageX, e.pageY);                     // senão abre
        }
      };
      document.addEventListener('contextmenu', ctxHandler);
      window[LISTENER_KEY] = ctxHandler;
    })
    .catch(console.error);

  /* -------------------- constrói painel ----------------------- */
  function buildPanel(clickX, clickY) {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.dataset.ready = '0';          // flag p/ ainda não posicionado
    document.body.appendChild(panel);

    /* campos a exibir */
    const prefixes = [
      'requester_', 'observer_', 'assign_',
      'status_', 'priority_', 'slas_id_ttr_'
    ];

    /* guardamos referências p/ devolver depois */
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

    panel.__restores = restores;        // anexa ao elemento

    /* posiciona – depois de renderizar calculamos overflow */
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

    /* listener de clique fora para fechar */
    const outsideHandler = ev => {
      const p = document.getElementById(PANEL_ID);
      if (!p) return;
      if (p.contains(ev.target)) return;   // clique dentro → ignora
      closePanel();
    };
    document.addEventListener('mousedown', outsideHandler, true);
    window[CLICK_KEY] = outsideHandler;
  }

  /* --------------------- fecha painel ------------------------- */
  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    /* devolve campos p/ local original */
    (panel.__restores || []).forEach(({ field, placeholder }) => {
      if (placeholder.parentNode) {
        placeholder.parentNode.insertBefore(field, placeholder);
        placeholder.remove();
      }
    });

    panel.remove();

    /* remove listener de clique externo, se existir */
    if (window[CLICK_KEY]) {
      document.removeEventListener('mousedown', window[CLICK_KEY], true);
      delete window[CLICK_KEY];
    }
  }
}

/* ---------- ícone ---------- */
chrome.action.onClicked.addListener(tab => {
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: toggleFocusInPage });
});

/* ---------- atalho Alt + Shift + Q ---------- */
chrome.commands.onCommand.addListener((cmd, tab) => {
  if (cmd !== 'toggle-focus') return;
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: toggleFocusInPage });
});
