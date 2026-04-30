import { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider.js";
import { OllamaProvider } from "./providers/OllamaProvider.js";
import { CustomProvider } from "./providers/CustomProvider.js";

export const DEFAULT_SETTINGS = {
  providerName: "Ollama local",
  providerType: "ollama",
  baseUrl: "http://localhost:11434",
  chatPath: "/api/chat",
  model: "llama3.1",
  temperature: 0.3,
  maxTokens: 800,
  timeoutMs: 60000,
  requiresApiKey: false,
  toolsEnabled: true,
  longTermMemoryEnabled: true,
  debugEnabled: false,
  persistLogs: false,
  asyncMemoryOptimizationEnabled: true,
  llmMemoryOptimizationEnabled: false,
  maxShortTermMessages: 24,
  maxLongTermContextItems: 6,
  contextTokenBudget: 3500,
  customHeaders: {}
};

export class LLMService {
  constructor({ logger }) {
    this.logger = logger;
    this.providers = {
      "openai-compatible": new OpenAICompatibleProvider(),
      ollama: new OllamaProvider(),
      custom: new CustomProvider()
    };
  }

  async chat({ messages, config, secrets }) {
    const settings = { ...DEFAULT_SETTINGS, ...config };
    const provider = this.providers[settings.providerType];
    if (!provider) {
      return { ok: false, error: { message: `Provider não suportado: ${settings.providerType}`, code: "UNSUPPORTED_PROVIDER", details: {} } };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(settings.timeoutMs) || DEFAULT_SETTINGS.timeoutMs);
    try {
      this.logger?.debug("Provider selecionado", {
        providerType: settings.providerType,
        baseUrl: settings.baseUrl,
        chatPath: settings.chatPath,
        model: settings.model,
        requiresApiKey: settings.requiresApiKey
      });
      return await provider.chat({ messages, config: settings, secrets, signal: controller.signal });
    } catch (error) {
      const isAbort = error?.name === "AbortError";
      const result = {
        ok: false,
        error: {
          message: isAbort ? "Tempo limite excedido ao chamar o provider." : error?.message || "Falha ao chamar o provider.",
          code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
          details: {}
        }
      };
      this.logger?.error("Erro de LLM", result.error);
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }
}
