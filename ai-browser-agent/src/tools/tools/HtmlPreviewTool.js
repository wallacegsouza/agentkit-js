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
    const preview = window.open("", "_blank", "noopener,noreferrer");
    if (!preview) throw new Error("Não foi possível abrir a janela. Verifique se popups estão bloqueados.");
    preview.document.open();
    preview.document.write(outerDocument);
    preview.document.close();
    return {
      opened: true,
      title,
      scriptsEnabled: allowScripts,
      htmlCharacters: html.length,
      cssCharacters: css.length,
      jsCharacters: js.length
    };
  }
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
