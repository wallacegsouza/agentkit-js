import { limitString } from "./ToolSafety.js";

export class TextFormatterTool {
  constructor() {
    this.name = "text_formatter";
    this.description = "Formata texto informado explicitamente pelo usuário.";
    this.parameters = { text: "string", mode: "trim|single-space|lower|upper|title|lines" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const text = limitString(args.text, 200000, "text");
    const mode = String(args.mode || "trim");
    const formatted = format(text, mode);
    return {
      mode,
      formatted,
      beforeCharacters: text.length,
      afterCharacters: formatted.length
    };
  }
}

function format(text, mode) {
  if (mode === "single-space") return text.replace(/\s+/g, " ").trim();
  if (mode === "lower") return text.toLowerCase();
  if (mode === "upper") return text.toUpperCase();
  if (mode === "title") return text.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  if (mode === "lines") return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join("\n");
  return text.trim();
}
