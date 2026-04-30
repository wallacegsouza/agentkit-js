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
      this.logger.info("Tool chamada", { name });
      const data = await tool.execute(args);
      const result = { ok: true, tool: name, data };
      this.logger.debug("Resultado de tool", { name, data });
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
