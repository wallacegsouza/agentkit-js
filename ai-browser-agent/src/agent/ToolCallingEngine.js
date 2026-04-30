import { parseJsonFromText } from "../utils/SafeJson.js";

export class ToolCallingEngine {
  constructor({ toolsService }) {
    this.toolsService = toolsService;
  }

  extractToolCall(text) {
    const parsed = parseJsonFromText(text);
    if (!parsed?.tool) return null;
    return { name: parsed.tool, args: parsed.args || {} };
  }

  async executeFromText(text) {
    const call = this.extractToolCall(text);
    if (!call) return null;
    return this.toolsService.execute(call.name, call.args);
  }
}
