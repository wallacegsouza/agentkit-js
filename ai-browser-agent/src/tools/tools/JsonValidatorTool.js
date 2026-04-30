import { limitString } from "./ToolSafety.js";

export class JsonValidatorTool {
  constructor() {
    this.name = "json_validator";
    this.description = "Valida e formata JSON informado pelo usuário.";
    this.parameters = { text: "string" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const text = limitString(args.text, 250000, "text");
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      return {
        valid: true,
        formatted,
        type: Array.isArray(parsed) ? "array" : typeof parsed,
        characters: formatted.length
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        position: extractPosition(error.message)
      };
    }
  }
}

function extractPosition(message) {
  const match = String(message || "").match(/position\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}
