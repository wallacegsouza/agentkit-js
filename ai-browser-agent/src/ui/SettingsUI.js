import { Modal } from "./Modal.js";
import { DEFAULT_SETTINGS } from "../llm/LLMService.js";
import { sanitizeHeaders } from "../llm/providers/CustomProvider.js";
import { safeParseJson } from "../utils/SafeJson.js";

export class SettingsUI {
  constructor({ settingsStore, runtimeSecrets, eventBus, toast }) {
    this.settingsStore = settingsStore;
    this.runtimeSecrets = runtimeSecrets;
    this.eventBus = eventBus;
    this.toast = toast;
  }

  open() {
    const settings = this.settingsStore.get();
    const content = document.createElement("form");
    content.className = "grid gap-4 text-sm";
    content.innerHTML = `
      <div class="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">A API key é usada somente durante esta sessão e não será salva.</div>
      <div class="grid gap-3 md:grid-cols-2">
        ${input("providerName", "Nome do provider", settings.providerName)}
        <label class="grid gap-1">Tipo do provider
          <select name="providerType" class="rounded-md border border-zinc-300 px-3 py-2">
            ${option("openai-compatible", settings.providerType)}
            ${option("ollama", settings.providerType)}
            ${option("custom", settings.providerType)}
          </select>
        </label>
        ${input("baseUrl", "Endpoint base", settings.baseUrl)}
        ${input("chatPath", "Caminho da API de chat", settings.chatPath)}
        ${input("model", "Modelo", settings.model)}
        ${input("apiKey", "API key da sessão", "", "password", "Não será persistida")}
        ${input("temperature", "Temperature", settings.temperature, "number", "", "0.1")}
        ${input("maxTokens", "Max tokens", settings.maxTokens, "number")}
        ${input("timeoutMs", "Timeout ms", settings.timeoutMs, "number")}
        ${input("contextTokenBudget", "Orçamento contexto", settings.contextTokenBudget, "number")}
      </div>
      <label class="grid gap-1">Headers customizados não sensíveis em JSON
        <textarea name="customHeaders" class="min-h-20 rounded-md border border-zinc-300 px-3 py-2">${JSON.stringify(settings.customHeaders || {}, null, 2)}</textarea>
      </label>
      <div class="grid gap-2 md:grid-cols-2">
        ${checkbox("requiresApiKey", "Provider exige API key", settings.requiresApiKey)}
        ${checkbox("toolsEnabled", "Ferramentas habilitadas", settings.toolsEnabled)}
        ${checkbox("longTermMemoryEnabled", "Memória longa habilitada", settings.longTermMemoryEnabled)}
        ${checkbox("debugEnabled", "Logs debug habilitados", settings.debugEnabled)}
        ${checkbox("persistLogs", "Salvar logs recentes", settings.persistLogs)}
        ${checkbox("asyncMemoryOptimizationEnabled", "Otimização assíncrona de memória", settings.asyncMemoryOptimizationEnabled)}
        ${checkbox("llmMemoryOptimizationEnabled", "Otimização de memória com LLM", settings.llmMemoryOptimizationEnabled)}
      </div>
      <footer class="flex justify-end gap-2 border-t border-zinc-200 pt-4">
        <button type="submit" class="rounded-md bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-800">Salvar</button>
      </footer>
    `;
    content.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(content);
      const apiKey = String(form.get("apiKey") || "").trim();
      if (apiKey) this.runtimeSecrets.setApiKey(apiKey);
      const headers = sanitizeHeaders(safeParseJson(form.get("customHeaders"), {}));
      const next = {
        ...DEFAULT_SETTINGS,
        providerName: form.get("providerName"),
        providerType: form.get("providerType"),
        baseUrl: form.get("baseUrl"),
        chatPath: form.get("chatPath"),
        model: form.get("model"),
        temperature: Number(form.get("temperature")),
        maxTokens: Number(form.get("maxTokens")),
        timeoutMs: Number(form.get("timeoutMs")),
        contextTokenBudget: Number(form.get("contextTokenBudget")),
        customHeaders: headers,
        requiresApiKey: form.has("requiresApiKey"),
        toolsEnabled: form.has("toolsEnabled"),
        longTermMemoryEnabled: form.has("longTermMemoryEnabled"),
        debugEnabled: form.has("debugEnabled"),
        persistLogs: form.has("persistLogs"),
        asyncMemoryOptimizationEnabled: form.has("asyncMemoryOptimizationEnabled"),
        llmMemoryOptimizationEnabled: form.has("llmMemoryOptimizationEnabled")
      };
      this.settingsStore.set(next);
      this.eventBus.emit("settings:changed", next);
      this.toast.show("Configurações salvas.", "success");
    });
    new Modal({ title: "Configurações", content, width: "max-w-4xl" }).open();
  }
}

function input(name, label, value, type = "text", placeholder = "", step = "") {
  return `<label class="grid gap-1">${label}<input name="${name}" type="${type}" value="${value ?? ""}" placeholder="${placeholder}" ${step ? `step="${step}"` : ""} class="rounded-md border border-zinc-300 px-3 py-2" /></label>`;
}

function checkbox(name, label, checked) {
  return `<label class="flex items-center gap-2 rounded-md border border-zinc-200 p-3"><input name="${name}" type="checkbox" ${checked ? "checked" : ""} class="h-4 w-4" /> ${label}</label>`;
}

function option(value, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`;
}
