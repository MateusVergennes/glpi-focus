const STYLE_ID = "__glpi_focus_css__";

async function injectOrRemoveCSS() {
    const existing = document.getElementById(STYLE_ID);
    if (existing) {
        existing.remove(); // toggle OFF
        return;
    }

    // Atraso para garantir que o conteúdo tenha sido completamente carregado
    await new Promise(resolve => setTimeout(resolve, 1000));

    const css = await fetch(chrome.runtime.getURL("style.css")).then(r => r.text());
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style); // toggle ON
}
