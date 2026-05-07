import { assertNoSecretText, limitString } from "./ToolSafety.js";

const VALID_TYPES = new Set(["fact", "preference", "decision", "task", "summary", "context"]);

export class MemoryCreateTool {
  constructor({ memoryService }) {
    this.memoryService = memoryService;
    this.name = "memory_create";
    this.description = "Cria uma memória longa manualmente após confirmação.";
    this.parameters = { type: "fact|preference|decision|task|summary|context", content: "string", importance: "number opcional", keywords: "array opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const type = VALID_TYPES.has(args.type) ? args.type : "context";
    const content = limitString(args.content, 8000, "content").trim();
    if (!content) throw new Error("Informe conteúdo para a memória.");
    assertNoSecretText(content);
    const memory = this.memoryService.createLongMemory({
      type,
      content,
      importance: args.importance,
      confidence: args.confidence ?? 0.8,
      keywords: Array.isArray(args.keywords) ? args.keywords.map(String).slice(0, 20) : undefined
    });
    if (!memory) throw new Error("A memória não foi criada.");
    return { created: true, memory };
  }
}
