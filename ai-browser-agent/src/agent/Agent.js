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
    const startedAt = performance.now();
    const settings = this.settingsProvider();
    this.logger.trace("Agent send iniciado", {
      userCharacters: String(userContent || "").length,
      providerType: settings.providerType,
      model: settings.model,
      toolsEnabled: settings.toolsEnabled,
      longTermMemoryEnabled: settings.longTermMemoryEnabled
    });
    const userMessage = this.memoryService.addShortMessage({ role: "user", content: userContent });
    this.logger.info("Mensagem enviada", { messageId: userMessage.id });
    this.logger.trace("Mensagem do usuário salva na memória curta", {
      messageId: userMessage.id,
      conversationMessages: this.memoryService.shortTermMemory.getMessages().length
    });

    let context = this.contextBuilder.build({ userMessage: userContent, settings });
    this.logger.debug("Contexto montado", { estimatedTokens: context.estimatedTokens, memories: context.memories.map((item) => item.id) });
    this.logger.trace("Contexto inicial montado", {
      estimatedTokens: context.estimatedTokens,
      messageCount: context.messages.length,
      memoryCount: context.memories.length,
      memoryIds: context.memories.map((item) => item.id)
    });

    let result = await this.llmService.chat({
      messages: context.messages,
      config: settings,
      secrets: { apiKey: this.runtimeSecrets.getApiKey() }
    });

    if (!result.ok) {
      this.logger.trace("Agent send falhou antes da resposta final", {
        errorCode: result.error.code,
        durationMs: Math.round(performance.now() - startedAt)
      });
      this.memoryService.addShortMessage({ role: "system", content: result.error.message, metadata: { code: result.error.code } });
      return { ok: false, error: result.error };
    }

    const toolCall = settings.toolsEnabled ? this.toolCallingEngine.extractToolCall(result.content) : null;
    this.logger.trace("Resposta inicial recebida", {
      contentCharacters: String(result.content || "").length,
      toolRequested: Boolean(toolCall),
      toolName: toolCall?.name || null
    });
    const toolResult = toolCall ? await this.toolCallingEngine.executeCall(toolCall) : null;
    if (toolResult) {
      this.logger.trace("Resultado de tool recebido pelo agente", {
        tool: toolResult.tool,
        ok: toolResult.ok,
        errorCode: toolResult.ok ? null : toolResult.error?.code
      });
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
      this.logger.trace("Contexto com resultado de tool montado", {
        estimatedTokens: context.estimatedTokens,
        messageCount: context.messages.length,
        tool: toolResult.tool
      });
      result = await this.llmService.chat({
        messages: context.messages,
        config: settings,
        secrets: { apiKey: this.runtimeSecrets.getApiKey() }
      });
      if (!result.ok) {
        this.logger.trace("Agent send falhou após tool", {
          tool: toolResult.tool,
          errorCode: result.error.code,
          durationMs: Math.round(performance.now() - startedAt)
        });
        return { ok: false, error: result.error, toolMessage };
      }
    }

    const assistantMessage = this.memoryService.addShortMessage({ role: "assistant", content: result.content, metadata: { usage: result.usage } });
    this.memoryOptimizer.schedule();
    this.logger.trace("Agent send finalizado", {
      assistantMessageId: assistantMessage.id,
      assistantCharacters: String(result.content || "").length,
      durationMs: Math.round(performance.now() - startedAt),
      memoryOptimizationScheduled: true
    });
    return { ok: true, message: assistantMessage, usage: result.usage };
  }
}
