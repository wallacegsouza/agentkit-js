import { assertNoSecretText, limitString } from "./ToolSafety.js";

const MAX_TOTAL_CHARS = 250000;

export class HtmlPreviewTool {
  constructor() {
    this.name = "html_preview";
    this.description = "Renderiza HTML, CSS e JavaScript opcional em uma nova janela isolada. Use para previews visuais; JavaScript fica desabilitado por padrão.";
    this.parameters = {
      title: "string opcional",
      html: "string obrigatório",
      css: "string opcional",
      js: "string opcional",
      allowScripts: "boolean opcional"
    };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const title = limitString(args.title || "Preview do agente", 120, "title");
    const html = limitString(args.html, MAX_TOTAL_CHARS, "html").trim();
    const css = limitString(args.css || "", MAX_TOTAL_CHARS, "css");
    const js = limitString(args.js || "", MAX_TOTAL_CHARS, "js");
    const allowScripts = Boolean(args.allowScripts);
    if (!html) throw new Error("Informe HTML para renderizar.");
    if (html.length + css.length + js.length > MAX_TOTAL_CHARS) {
      throw new Error(`Conteúdo excede o limite total de ${MAX_TOTAL_CHARS} caracteres.`);
    }
    assertNoSecretText(title, html, css, js);

    const childDocument = buildChildDocument({ title, html, css, js, allowScripts });
    const outerDocument = buildOuterDocument({ title, childDocument, allowScripts });
    const preview = openPreviewWindow(outerDocument);
    if (!preview.opened) {
      showPreviewFallback({ title, outerDocument });
    }
    return {
      opened: preview.opened,
      fallbackVisible: !preview.opened,
      title,
      scriptsEnabled: allowScripts,
      htmlCharacters: html.length,
      cssCharacters: css.length,
      jsCharacters: js.length
    };
  }
}

function openPreviewWindow(outerDocument) {
  try {
    const preview = window.open("about:blank", "_blank");
    if (!preview) return { opened: false };
    preview.opener = null;
    preview.document.open();
    preview.document.write(outerDocument);
    preview.document.close();
    return { opened: true };
  } catch {
    return { opened: false };
  }
}

function showPreviewFallback({ title, outerDocument }) {
  document.querySelector("[data-html-preview-fallback]")?.remove();
  const blob = new Blob([outerDocument], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const wrapper = document.createElement("div");
  wrapper.dataset.htmlPreviewFallback = "true";
  wrapper.style.cssText = [
    "position:fixed",
    "inset:auto 16px 16px auto",
    "z-index:9999",
    "max-width:min(420px, calc(100vw - 32px))",
    "background:#fff",
    "border:1px solid #d4d4d8",
    "box-shadow:0 18px 45px rgba(0,0,0,.18)",
    "border-radius:10px",
    "font-family:system-ui, sans-serif",
    "color:#18181b",
    "overflow:hidden"
  ].join(";");
  wrapper.innerHTML = `
    <div style="padding:12px 14px; border-bottom:1px solid #e4e4e7; font-weight:600;">Preview HTML pronto</div>
    <div style="padding:12px 14px; font-size:13px; line-height:1.45;">
      O browser bloqueou a abertura automática. Use o botão abaixo para abrir o preview em uma nova janela.
    </div>
    <div style="display:flex; gap:8px; justify-content:flex-end; padding:12px 14px; background:#fafafa;">
      <button data-close style="border:1px solid #d4d4d8; background:#fff; border-radius:6px; padding:8px 10px; cursor:pointer;">Fechar</button>
      <button data-open style="border:1px solid #18181b; background:#18181b; color:#fff; border-radius:6px; padding:8px 10px; cursor:pointer;">Abrir preview</button>
    </div>
  `;
  wrapper.querySelector("[data-open]").addEventListener("click", () => {
    const preview = window.open(url, "_blank");
    if (preview) preview.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    wrapper.remove();
  });
  wrapper.querySelector("[data-close]").addEventListener("click", () => {
    URL.revokeObjectURL(url);
    wrapper.remove();
  });
  document.body.append(wrapper);
}

function buildChildDocument({ title, html, css, js, allowScripts }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
${html}
${allowScripts && js ? `<script>${js}<\/script>` : ""}
</body>
</html>`;
}

function buildOuterDocument({ title, childDocument, allowScripts }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
    header { padding: 10px 14px; background: #18181b; color: #fff; font-size: 13px; }
    iframe { width: 100vw; height: calc(100vh - 39px); border: 0; background: #fff; display: block; }
  </style>
</head>
<body>
  <header>Conteúdo gerado pelo agente em ambiente isolado. Scripts: ${allowScripts ? "habilitados" : "desabilitados"}.</header>
  <iframe sandbox="${allowScripts ? "allow-scripts" : ""}" srcdoc="${escapeAttribute(childDocument)}"></iframe>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}
