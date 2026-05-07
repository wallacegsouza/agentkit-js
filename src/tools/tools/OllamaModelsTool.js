import { joinUrl } from "./ToolSafety.js";

export class OllamaModelsTool {
  constructor({ settingsProvider }) {
    this.settingsProvider = settingsProvider;
    this.name = "ollama_models";
    this.description = "Lista modelos disponíveis em um servidor Ollama via /api/tags.";
    this.parameters = { baseUrl: "string opcional" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const settings = this.settingsProvider();
    const baseUrl = args.baseUrl || settings.baseUrl || "http://localhost:11434";
    const response = await fetch(joinUrl(baseUrl, "/api/tags"));
    const raw = await response.json();
    if (!response.ok) throw new Error(raw?.error || response.statusText);
    const models = (raw.models || []).map((model) => ({
      name: model.name,
      size: model.size ?? null,
      modifiedAt: model.modified_at ?? null
    }));
    return { baseUrl, count: models.length, models };
  }
}
