import { assertNoSecretText, limitString } from "./ToolSafety.js";

export class MemorySearchTool {
  constructor({ memoryService, settingsProvider }) {
    this.memoryService = memoryService;
    this.settingsProvider = settingsProvider;
    this.name = "memory_search";
    this.description = "Busca memórias longas relevantes para um texto informado.";
    this.parameters = { query: "string", limit: "number opcional" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const query = limitString(args.query, 2000, "query").trim();
    if (!query) throw new Error("Informe uma query para buscar memórias.");
    assertNoSecretText(query);
    const limit = Math.max(1, Math.min(Number(args.limit) || 6, 20));
    const debug = this.settingsProvider().debugEnabled;
    const results = this.memoryService.longTermMemory.search(query, limit, true).map(({ item, score }) => {
      const base = {
        id: item.id,
        type: item.type,
        content: item.content,
        keywords: item.keywords || [],
        score
      };
      if (!debug) return base;
      return {
        ...base,
        importance: item.importance,
        confidence: item.confidence,
        usageCount: item.usageCount,
        updatedAt: item.updatedAt
      };
    });
    return { query, count: results.length, results };
  }
}
