import { escapeHtml } from "../utils/Dom.js";

export class ChatUI {
  constructor({ root, agent, memoryService, settingsUI, memoryUI, helpUI, debugUI, settingsStore, eventBus, toast }) {
    this.root = root;
    this.agent = agent;
    this.memoryService = memoryService;
    this.settingsUI = settingsUI;
    this.memoryUI = memoryUI;
    this.helpUI = helpUI;
    this.debugUI = debugUI;
    this.settingsStore = settingsStore;
    this.eventBus = eventBus;
    this.toast = toast;
    this.loading = false;
    this.eventBus.on("memory:short-changed", () => this.renderMessages());
    this.eventBus.on("settings:changed", () => this.renderDebug());
  }

  mount() {
    this.root.innerHTML = `
      <div class="flex min-h-screen flex-col md:flex-row">
        <aside class="border-b border-zinc-200 bg-white p-3 md:w-64 md:border-b-0 md:border-r">
          <div class="mb-3">
            <h1 class="text-lg font-semibold">AI Browser Agent</h1>
            <p class="text-xs text-zinc-500">Chat client-side com memória local</p>
          </div>
          <nav class="grid grid-cols-2 gap-2 md:grid-cols-1">
            <button data-settings class="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">Configurações</button>
            <button data-memory class="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">Memórias</button>
            <button data-help class="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">Ajuda</button>
            <button data-clear class="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">Limpar conversa</button>
          </nav>
          <div class="mt-4 rounded-md bg-zinc-100 p-3 text-xs text-zinc-600">
            Provider: <span data-provider></span><br />
            API key: somente sessão
          </div>
        </aside>
        <main class="flex min-h-0 flex-1 flex-col">
          <section data-messages class="flex-1 overflow-auto p-4 scrollbar-thin"></section>
          <div data-loading class="hidden border-t border-zinc-200 px-4 py-2 text-sm text-zinc-500">O agente está respondendo...</div>
          <form data-form class="border-t border-zinc-200 bg-white p-3">
            <div class="flex gap-2">
              <textarea data-input rows="2" class="min-h-12 flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none" placeholder="Escreva sua mensagem..."></textarea>
              <button data-send class="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Enviar</button>
            </div>
          </form>
          <section data-debug></section>
        </main>
      </div>
    `;
    this.root.querySelector("[data-settings]").addEventListener("click", () => this.settingsUI.open());
    this.root.querySelector("[data-memory]").addEventListener("click", () => this.memoryUI.open());
    this.root.querySelector("[data-help]").addEventListener("click", () => this.helpUI.open());
    this.root.querySelector("[data-clear]").addEventListener("click", () => {
      this.memoryService.clearConversation();
      this.toast.show("Conversa limpa.", "success");
    });
    this.root.querySelector("[data-form]").addEventListener("submit", (event) => this.handleSubmit(event));
    this.root.querySelector("[data-input]").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.root.querySelector("[data-form]").requestSubmit();
      }
    });
    this.renderMessages();
    this.renderProvider();
    this.renderDebug();
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (this.loading) return;
    const input = this.root.querySelector("[data-input]");
    const content = input.value.trim();
    if (!content) return;
    input.value = "";
    this.setLoading(true);
    const result = await this.agent.send(content);
    this.setLoading(false);
    if (!result.ok) this.toast.show(result.error.message, "error");
  }

  renderMessages() {
    const container = this.root.querySelector("[data-messages]");
    if (!container) return;
    const messages = this.memoryService.shortTermMemory.getMessages();
    container.innerHTML = messages.map((message) => messageTemplate(message)).join("") || `
      <div class="mx-auto mt-16 max-w-lg text-center text-zinc-500">
        <h2 class="mb-2 text-lg font-semibold text-zinc-800">Configure um provider e envie uma mensagem.</h2>
        <p class="text-sm">Use Ollama local ou qualquer endpoint OpenAI-compatible. A API key, quando usada, fica só na sessão.</p>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
    this.renderProvider();
  }

  renderProvider() {
    const provider = this.root.querySelector("[data-provider]");
    if (provider) provider.textContent = `${this.settingsStore.get().providerType} / ${this.settingsStore.get().model}`;
  }

  renderDebug() {
    const container = this.root.querySelector("[data-debug]");
    if (!container) return;
    const settings = this.settingsStore.get();
    if (settings.debugEnabled || settings.agentTraceEnabled) {
      this.debugUI.mount(container);
    } else {
      container.innerHTML = "";
    }
  }

  setLoading(value) {
    this.loading = value;
    this.root.querySelector("[data-loading]").classList.toggle("hidden", !value);
    this.root.querySelector("[data-send]").disabled = value;
  }
}

function messageTemplate(message) {
  const styles = {
    user: "ml-auto bg-zinc-950 text-white",
    assistant: "mr-auto bg-white text-zinc-900 border border-zinc-200",
    system: "mx-auto bg-amber-50 text-amber-950 border border-amber-200",
    tool: "mx-auto bg-sky-50 text-sky-950 border border-sky-200"
  };
  return `
    <article class="mb-3 flex">
      <div class="max-w-[88%] rounded-lg px-4 py-3 text-sm shadow-sm ${styles[message.role] || styles.system}">
        <div class="mb-1 text-xs font-semibold uppercase opacity-70">${escapeHtml(message.role)}</div>
        <div class="message-content">${escapeHtml(message.content)}</div>
      </div>
    </article>
  `;
}
