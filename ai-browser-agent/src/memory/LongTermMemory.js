import { createId } from "../utils/IdGenerator.js";
import { extractKeywords, MemoryScorer } from "./MemoryScorer.js";

const VALID_TYPES = new Set(["fact", "preference", "summary", "task", "decision", "context"]);

export class LongTermMemory {
  constructor({ repository }) {
    this.repository = repository;
    this.scorer = new MemoryScorer();
    this.items = this.repository.get("longTermMemory", []);
  }

  list() {
    return [...this.items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  create(input) {
    const now = new Date().toISOString();
    const memory = {
      id: createId("mem"),
      type: VALID_TYPES.has(input.type) ? input.type : "context",
      content: String(input.content || "").trim(),
      keywords: input.keywords?.length ? input.keywords : extractKeywords(input.content),
      importance: clamp(input.importance ?? 0.5),
      confidence: clamp(input.confidence ?? 0.6),
      usageCount: 0,
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now,
      sourceMessageIds: input.sourceMessageIds || []
    };
    if (!memory.content || looksSensitive(memory.content)) return null;
    this.items.unshift(memory);
    this.save();
    return memory;
  }

  update(id, patch) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const next = { ...this.items[index], ...patch, updatedAt: new Date().toISOString() };
    if (looksSensitive(next.content)) return null;
    next.keywords = patch.keywords || extractKeywords(next.content);
    this.items[index] = next;
    this.save();
    return next;
  }

  remove(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.save();
  }

  clear() {
    this.items = [];
    this.save();
  }

  search(query, limit = 6, includeScores = false) {
    const scored = this.items
      .map((item) => ({ item, score: this.scorer.score(item, query) }))
      .filter(({ score }) => score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    const now = new Date().toISOString();
    for (const { item } of scored) {
      item.usageCount = Number(item.usageCount || 0) + 1;
      item.lastUsedAt = now;
    }
    if (scored.length) this.save();
    return includeScores ? scored : scored.map(({ item }) => item);
  }

  export() {
    return { memories: this.list(), exportedAt: new Date().toISOString() };
  }

  import(data) {
    const memories = Array.isArray(data) ? data : data?.memories;
    if (!Array.isArray(memories)) throw new Error("JSON de memória longa inválido.");
    this.items = memories
      .filter((item) => item && VALID_TYPES.has(item.type) && item.content && !looksSensitive(item.content))
      .map((item) => ({ ...item, id: item.id || createId("mem") }));
    this.save();
  }

  save() {
    this.repository.set("longTermMemory", this.items);
  }
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function looksSensitive(text) {
  return /(sk-[a-z0-9_-]{12,}|bearer\s+[a-z0-9._-]{12,}|(?:senha|password|token|secret)\s*[:=]\s*\S{6,})/i.test(String(text || ""));
}
