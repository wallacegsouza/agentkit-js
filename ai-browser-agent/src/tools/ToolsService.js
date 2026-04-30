export class ToolsService {
  constructor({ logger, confirmationProvider }) {
    this.logger = logger;
    this.confirmationProvider = confirmationProvider;
    this.tools = new Map();
    this.enabled = true;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  register(tool) {
    this.tools.set(tool.name, tool);
  }

  listForPrompt() {
    if (!this.enabled) return [];
    return [...this.tools.values()].map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters || {},
      sensitive: Boolean(tool.sensitive)
    }));
  }

  async execute(name, args = {}) {
    if (!this.enabled) return toolError(name, "Ferramentas estão desabilitadas.", "TOOLS_DISABLED");
    const tool = this.tools.get(name);
    if (!tool) return toolError(name, `Ferramenta não encontrada: ${name}`, "TOOL_NOT_FOUND");
    if (tool.sensitive) {
      const allowed = await this.confirmationProvider?.(`Permitir execução da ferramenta sensível "${name}"?`);
      if (!allowed) return toolError(name, "Execução cancelada pelo usuário.", "USER_DENIED");
    }
    try {
      const startedAt = performance.now();
      this.logger.info("Tool chamada", { name });
      this.logger.trace("Tool execution iniciado", {
        name,
        sensitive: Boolean(tool.sensitive),
        argKeys: Object.keys(args || {})
      });
      const data = await tool.execute(args);
      const result = { ok: true, tool: name, data };
      this.logger.debug("Resultado de tool", summarizeToolResult(name, data));
      this.logger.trace("Tool execution finalizado", {
        ...summarizeToolResult(name, data),
        durationMs: Math.round(performance.now() - startedAt)
      });
      return result;
    } catch (error) {
      this.logger.warn("Erro de tool", { name, message: error?.message });
      return toolError(name, error?.message || "Erro ao executar ferramenta.", "TOOL_ERROR");
    }
  }
}

function toolError(tool, message, code) {
  return { ok: false, tool, error: { message, code } };
}

function summarizeToolResult(name, data) {
  if (!data || typeof data !== "object") return { name, resultType: typeof data };
  return {
    name,
    keys: Object.keys(data).slice(0, 12),
    count: data.count ?? data.results?.length ?? data.models?.length ?? null,
    opened: data.opened ?? null,
    downloaded: data.downloaded ?? null,
    characters: data.characters ?? data.htmlCharacters ?? null
  };
}
