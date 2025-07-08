(async () => {
    const locale = navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
    const strings = await fetch(chrome.runtime.getURL('strings.json'))
        .then(r => r.json())
        .catch(() => ({}));
    const t = strings[locale] || strings.en;

    document.getElementById('title').textContent = t.TITLE;
    document.getElementById('desc1').textContent = t.DESC1;
    document.getElementById('desc2').textContent = t.DESC2;
    document.getElementById('shortcut-label').textContent = t.SHORTCUT;
    document.getElementById('toggle').textContent = t.BUTTON;

    document.getElementById('toggle').addEventListener('click', () => {
        chrome.runtime.sendMessage({ command: 'toggle-focus' });
        window.close();
    });
})();
