import { limitString } from "./ToolSafety.js";

export class RegexTesterTool {
  constructor() {
    this.name = "regex_tester";
    this.description = "Testa uma regex sobre texto informado pelo usuário com limites simples de segurança.";
    this.parameters = { pattern: "string", flags: "string opcional", text: "string" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const pattern = limitString(args.pattern, 500, "pattern");
    const text = limitString(args.text, 50000, "text");
    const flags = sanitizeFlags(args.flags || "g");
    const startedAt = performance.now();
    const regex = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
    const matches = [];
    let match;
    while ((match = regex.exec(text)) && matches.length < 100) {
      if (performance.now() - startedAt > 80) throw new Error("Regex interrompida por limite de tempo.");
      matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
      if (match[0] === "") regex.lastIndex += 1;
    }
    return { pattern, flags: regex.flags, count: matches.length, matches };
  }
}

function sanitizeFlags(flags) {
  return [...new Set(String(flags).replace(/[^dgimsuvy]/g, "").split(""))].join("");
}
