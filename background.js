function toggleFocusInPage() {
  const STYLE_ID = '__glpi_focus_css__';
  const styleTag = document.getElementById(STYLE_ID);

  if (styleTag) {
    // já aplicado ➜ remove
    styleTag.remove();
    return;
  }

  // ainda não aplicado ➜ carrega style.css        
  fetch(chrome.runtime.getURL('style.css'))
    .then(r => r.text())
    .then(css => {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = css;
      document.head.appendChild(s);
    })
    .catch(console.error);
}

/* ---------- Clique no ícone da extensão ---------- */
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleFocusInPage
  });
});

/* ---------- Atalho de teclado Alt+Shift+Q ---------- */
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'toggle-focus') return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleFocusInPage
  });
});