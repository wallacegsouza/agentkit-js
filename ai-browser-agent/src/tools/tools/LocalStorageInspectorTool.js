export class LocalStorageInspectorTool {
  constructor(repository) {
    this.repository = repository;
    this.name = "local_storage_inspector";
    this.description = "Lista chaves do namespace aiAgent:* e lê/remova valores somente após confirmação.";
    this.parameters = { action: "list|get|remove", key: "string opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const action = String(args.action || "list");
    if (action === "list") return { keys: this.repository.listKeys() };
    if (action === "get") return { key: args.key, value: this.repository.get(args.key, null) };
    if (action === "remove") {
      this.repository.remove(args.key);
      return { removed: args.key };
    }
    throw new Error("Ação inválida.");
  }
}
