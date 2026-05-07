export class MemoryDeleteTool {
  constructor({ memoryService }) {
    this.memoryService = memoryService;
    this.name = "memory_delete";
    this.description = "Apaga uma memória longa específica após confirmação.";
    this.parameters = { id: "string" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const id = String(args.id || "").trim();
    if (!id) throw new Error("Informe o ID da memória.");
    this.memoryService.removeLongMemory(id);
    return { deleted: true, id };
  }
}
