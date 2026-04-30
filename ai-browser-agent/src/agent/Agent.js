import { ToolCallingEngine } from "./ToolCallingEngine.js";

export class Agent {
  constructor({ llmService, contextBuilder, memoryService, memoryOptimizer, runtimeSecrets, settingsProvider, logger }) {
    this.llmService = llmService;
    this.contextBuilder = contextBuilder;
    this.memoryService = memoryService;
    this.memoryOptimizer = memoryOptimizer;
    this.runtimeSecrets = runtimeSecrets;
    this.settingsProvider = settingsProvider;
    this.logger = logger;
    this.toolCallingEngine = new ToolCallingEngine({ toolsService: contextBuilder.toolsService });
  }

  async send(userContent) {
    const settings = this.settingsProvider();
    const userMessage = this.memoryService.addShortMessage({ role: "user", content: userContent });
    this.logger.info("Mensagem enviada", { messageId: userMessage.id });

    let context = this.contextBuilder.build({ userMessage: userContent, settings });
    this.logger.debug("Contexto montado", { estimatedTokens: context.estimatedTokens, memories: context.memories.map((item) => item.id) });

    let result = await this.llmService.chat({
      messages: context.messages,
      config: settings,
      secrets: { apiKey: this.runtimeSecrets.getApiKey() }
    });

    if (!result.ok) {
      this.memoryService.addShortMessage({ role: "system", content: result.error.message, metadata: { code: result.error.code } });
      return { ok: false, error: result.error };
    }

    const toolResult = settings.toolsEnabled ? await this.toolCallingEngine.executeFromText(result.content) : null;
    if (toolResult) {
      const toolMessage = this.memoryService.addShortMessage({
        role: "tool",
        content: JSON.stringify(toolResult, null, 2),
        metadata: { tool: toolResult.tool }
      });
      context = this.contextBuilder.build({
        userMessage: userContent,
        settings,
        toolMessages: [{ content: `Resultado da ferramenta ${toolResult.tool}: ${JSON.stringify(toolResult.data || toolResult.error)}` }]
      });
      result = await this.llmService.chat({
        messages: context.messages,
        config: settings,
        secrets: { apiKey: this.runtimeSecrets.getApiKey() }
      });
      if (!result.ok) return { ok: false, error: result.error, toolMessage };
    }

    const assistantMessage = this.memoryService.addShortMessage({ role: "assistant", content: result.content, metadata: { usage: result.usage } });
    this.memoryOptimizer.schedule();
    return { ok: true, message: assistantMessage, usage: result.usage };
  }
}
