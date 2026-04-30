import { limitString } from "./ToolSafety.js";

export class MarkdownToHtmlTool {
  constructor() {
    this.name = "markdown_to_html";
    this.description = "Converte Markdown simples para HTML seguro, sem HTML bruto.";
    this.parameters = { markdown: "string" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const markdown = limitString(args.markdown, 200000, "markdown");
    return { html: renderMarkdown(markdown), characters: markdown.length };
  }
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inList = false;
  for (const line of lines) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) html.push("<ul>");
      inList = true;
      html.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (/^###\s+/.test(line)) html.push(`<h3>${inline(line.replace(/^###\s+/, ""))}</h3>`);
    else if (/^##\s+/.test(line)) html.push(`<h2>${inline(line.replace(/^##\s+/, ""))}</h2>`);
    else if (/^#\s+/.test(line)) html.push(`<h1>${inline(line.replace(/^#\s+/, ""))}</h1>`);
    else if (line.trim()) html.push(`<p>${inline(line)}</p>`);
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

function inline(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
