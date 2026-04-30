export class ToolListTool {
  constructor({ toolsService }) {
    this.toolsService = toolsService;
    this.name = "tool_list";
    this.description = "Lista ferramentas disponíveis, parâmetros, sensibilidade e status.";
    this.parameters = {};
    this.sensitive = false;
  }

  async execute() {
    return {
      enabled: this.toolsService.enabled,
      tools: this.toolsService.listForPrompt()
    };
  }
}
