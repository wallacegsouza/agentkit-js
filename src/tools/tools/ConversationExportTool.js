export class ConversationExportTool {
  constructor({ memoryService }) {
    this.memoryService = memoryService;
    this.name = "conversation_export";
    this.description = "Exporta a conversa atual em JSON sem incluir API key.";
    this.parameters = {};
    this.sensitive = true;
  }

  async execute() {
    const conversation = this.memoryService.shortTermMemory.export();
    return {
      exportedAt: conversation.exportedAt,
      conversationId: conversation.conversationId,
      messages: conversation.messages,
      messageCount: conversation.messages.length
    };
  }
}
