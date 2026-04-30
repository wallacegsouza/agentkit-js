import { escapeHtml } from "../utils/Dom.js";

export class DebugUI {
  constructor({ logger, eventBus }) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.container = null;
    this.eventBus.on("logs:changed", () => this.render());
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  render() {
    if (!this.container) return;
    const entries = this.logger.getEntries().slice(0, 30);
    this.container.innerHTML = `
      <div class="border-t border-zinc-200 bg-zinc-950 text-zinc-100">
        <div class="flex items-center justify-between px-4 py-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-300">Debug</h3>
          <button data-clear class="rounded border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">Limpar logs</button>
        </div>
        <div class="max-h-44 overflow-auto px-4 pb-3 text-xs scrollbar-thin">
          ${entries.map((entry) => `
            <div class="border-t border-zinc-800 py-2">
              <span class="font-semibold">${escapeHtml(entry.level)}</span>
              <span class="text-zinc-400">${escapeHtml(entry.createdAt)}</span>
              <div>${escapeHtml(entry.message)}</div>
            </div>
          `).join("") || "<p class=\"text-zinc-400\">Sem logs.</p>"}
        </div>
      </div>
    `;
    this.container.querySelector("[data-clear]")?.addEventListener("click", () => this.logger.clear());
  }
}
