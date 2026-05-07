import { createId } from "../../utils/IdGenerator.js";

export class UuidGeneratorTool {
  constructor() {
    this.name = "uuid_generator";
    this.description = "Gera UUIDs ou IDs simples com prefixo opcional.";
    this.parameters = { count: "number opcional", prefix: "string opcional", format: "uuid|prefixed opcional" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const count = Math.max(1, Math.min(Number(args.count) || 1, 50));
    const format = args.format === "prefixed" ? "prefixed" : "uuid";
    const prefix = String(args.prefix || "id").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "id";
    const values = Array.from({ length: count }, () => format === "uuid" ? crypto.randomUUID() : createId(prefix));
    return { count, format, values };
  }
}
