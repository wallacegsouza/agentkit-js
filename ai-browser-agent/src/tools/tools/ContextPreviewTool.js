import { BASE_SYSTEM_PROMPT } from "../../agent/PromptBuilder.js";
import { TokenEstimator } from "../../utils/TokenEstimator.js";
import { assertNoSecretText, limitString } from "./ToolSafety.js";

export class ContextPreviewTool {
  constructor({ memoryService, toolsService, settingsProvider }) {
    this.memoryService = memoryService;
    this.toolsService = toolsService;
    this.settingsProvider = settingsProvider;
    this.estimator = new TokenEstimator();
    this.name = "context_preview";
    this.description = "Mostra uma prévia segura do contexto que seria enviado ao LLM, sem API key ou secrets.";
    this.parameters = { userMessage: "string opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const settings = this.settingsProvider();
    const userMessage = limitString(args.userMessage || lastUserMessage(this.memoryService), 4000, "userMessage");
    assertNoSecretText(userMessage);
    const memories = settings.longTermMemoryEnabled
      ? this.memoryService.longTermMemory.search(userMessage, settings.maxLongTermContextItems || 6, true)
      : [];
    const tools = settings.toolsEnabled ? this.toolsService.listForPrompt() : [];
    const recentMessages = this.memoryService.shortTermMemory.getMessages().slice(-(settings.maxShortTermMessages || 24)).map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: message.createdAt
    }));
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\nMemórias relevantes: ${memories.length}\nFerramentas disponíveis: ${tools.length}`;
    const messages = [{ role: "system", content: systemPrompt }, ...recentMessages.map(({ role, content }) => ({ role, content }))];
    return {
      estimatedTokens: this.estimator.estimateMessages(messages),
      providerType: settings.providerType,
      model: settings.model,
      systemPrompt,
      memories: memories.map(({ item, score }) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        score
      })),
      recentMessages,
      tools
    };
  }
}

function lastUserMessage(memoryService) {
  return [...memoryService.shortTermMemory.getMessages()].reverse().find((message) => message.role === "user")?.content || "";
}
