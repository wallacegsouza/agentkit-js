import { Modal } from "./Modal.js";
import { downloadJson, escapeHtml, readFileAsText } from "../utils/Dom.js";
import { safeParseJson } from "../utils/SafeJson.js";

export class MemoryUI {
  constructor({ memoryService, settingsStore, toast, eventBus }) {
    this.memoryService = memoryService;
    this.settingsStore = settingsStore;
    this.toast = toast;
    this.eventBus = eventBus;
  }

  open() {
    const content = document.createElement("div");
    const render = () => {
      const shortMessages = this.memoryService.shortTermMemory.getMessages();
      const longMemories = this.memoryService.longTermMemory.list();
      const debug = this.settingsStore.get().debugEnabled;
      content.innerHTML = `
        <div class="space-y-5">
          <section>
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-semibold">Memória curta</h3>
              <div class="flex gap-2">
                <button data-export-short class="rounded-md border border-zinc-300 px-3 py-2 text-xs">Exportar conversa</button>
                <label class="rounded-md border border-zinc-300 px-3 py-2 text-xs cursor-pointer">Importar conversa<input data-import-short type="file" accept="application/json" class="hidden" /></label>
              </div>
            </div>
            <div class="max-h-48 overflow-auto rounded-md border border-zinc-200 p-2 text-xs scrollbar-thin">
              ${shortMessages.map((message) => `<p class="border-b border-zinc-100 py-1"><b>${message.role}</b>: ${escapeHtml(message.content)}</p>`).join("") || "Sem mensagens."}
            </div>
          </section>
          <section>
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-semibold">Memória longa</h3>
              <div class="flex gap-2">
                <button data-export-long class="rounded-md border border-zinc-300 px-3 py-2 text-xs">Exportar memória</button>
                <label class="rounded-md border border-zinc-300 px-3 py-2 text-xs cursor-pointer">Importar memória<input data-import-long type="file" accept="application/json" class="hidden" /></label>
                <button data-clear-long class="rounded-md border border-rose-300 px-3 py-2 text-xs text-rose-700">Limpar tudo</button>
              </div>
            </div>
            <div class="grid gap-2">
              ${longMemories.map((memory) => `
                <article class="rounded-md border border-zinc-200 p-3">
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <span class="rounded bg-zinc-100 px-2 py-1 text-xs font-medium">${memory.type}</span>
                    <button data-remove="${memory.id}" class="rounded-md px-2 py-1 text-xs text-rose-700 hover:bg-rose-50">Apagar</button>
                  </div>
                  <p class="text-sm text-zinc-800">${escapeHtml(memory.content)}</p>
                  <p class="mt-2 text-xs text-zinc-500">Keywords: ${(memory.keywords || []).map(escapeHtml).join(", ")}</p>
                  ${debug ? `<p class="mt-1 text-xs text-zinc-500">Importância ${memory.importance} | Confiança ${memory.confidence} | Uso ${memory.usageCount}</p>` : ""}
                </article>
              `).join("") || "<p class=\"text-sm text-zinc-500\">Sem memórias longas.</p>"}
            </div>
          </section>
        </div>
      `;
      bind();
    };
    const bind = () => {
      content.querySelector("[data-export-short]")?.addEventListener("click", () => downloadJson("conversation.json", this.memoryService.shortTermMemory.export()));
      content.querySelector("[data-export-long]")?.addEventListener("click", () => downloadJson("long-term-memory.json", this.memoryService.longTermMemory.export()));
      content.querySelector("[data-clear-long]")?.addEventListener("click", () => {
        if (!confirm("Limpar toda a memória longa?")) return;
        this.memoryService.longTermMemory.clear();
        this.eventBus.emit("memory:long-changed", []);
        render();
      });
      content.querySelectorAll("[data-remove]").forEach((button) => {
        button.addEventListener("click", () => {
          this.memoryService.removeLongMemory(button.dataset.remove);
          render();
        });
      });
      content.querySelector("[data-import-short]")?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        this.memoryService.shortTermMemory.import(safeParseJson(await readFileAsText(file), null));
        this.toast.show("Conversa importada.", "success");
        render();
      });
      content.querySelector("[data-import-long]")?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        this.memoryService.longTermMemory.import(safeParseJson(await readFileAsText(file), null));
        this.toast.show("Memória importada.", "success");
        render();
      });
    };
    render();
    new Modal({ title: "Memórias", content, width: "max-w-5xl" }).open();
  }
}
