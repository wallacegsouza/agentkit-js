import { assertNoSecretText, limitString } from "./ToolSafety.js";

export class MemoryUpdateTool {
  constructor({ memoryService }) {
    this.memoryService = memoryService;
    this.name = "memory_update";
    this.description = "Atualiza uma memória longa existente após confirmação.";
    this.parameters = { id: "string", content: "string opcional", type: "string opcional", importance: "number opcional", keywords: "array opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const id = String(args.id || "").trim();
    if (!id) throw new Error("Informe o ID da memória.");
    const patch = {};
    if (args.content != null) {
      patch.content = limitString(args.content, 8000, "content").trim();
      assertNoSecretText(patch.content);
    }
    if (args.type) patch.type = args.type;
    if (args.importance != null) patch.importance = Number(args.importance);
    if (Array.isArray(args.keywords)) patch.keywords = args.keywords.map(String).slice(0, 20);
    const memory = this.memoryService.updateLongMemory(id, patch);
    if (!memory) throw new Error("Memória não encontrada ou atualização bloqueada.");
    return { updated: true, memory };
  }
}
