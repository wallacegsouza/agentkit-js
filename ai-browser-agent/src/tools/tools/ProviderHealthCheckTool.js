import { joinUrl } from "./ToolSafety.js";

export class ProviderHealthCheckTool {
  constructor({ settingsProvider, runtimeSecrets }) {
    this.settingsProvider = settingsProvider;
    this.runtimeSecrets = runtimeSecrets;
    this.name = "provider_health_check";
    this.description = "Testa se o provider configurado responde sem expor API key em logs.";
    this.parameters = {};
    this.sensitive = true;
  }

  async execute() {
    const settings = this.settingsProvider();
    if (settings.requiresApiKey && !this.runtimeSecrets.getApiKey()) {
      throw new Error("Este provider exige API key. Informe a API key para esta sessão antes de testar.");
    }

    const startedAt = performance.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Number(settings.timeoutMs) || 15000);
    try {
      const headers = {};
      if (settings.requiresApiKey) headers.Authorization = `Bearer ${this.runtimeSecrets.getApiKey()}`;

      const url = healthUrl(settings);
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal
      });
      return {
        reachable: response.ok,
        status: response.status,
        statusText: response.statusText,
        providerType: settings.providerType,
        url,
        latencyMs: Math.round(performance.now() - startedAt)
      };
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

function healthUrl(settings) {
  if (settings.providerType === "ollama") return joinUrl(settings.baseUrl, "/api/tags");
  if (settings.providerType === "openai-compatible") return joinUrl(settings.baseUrl, "/models");
  return joinUrl(settings.baseUrl, settings.chatPath || "/");
}
