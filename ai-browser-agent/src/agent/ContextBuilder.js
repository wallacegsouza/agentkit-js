import { PromptBuilder } from "./PromptBuilder.js";
import { TokenEstimator } from "../utils/TokenEstimator.js";

export class ContextBuilder {
  constructor({ memoryService, toolsService }) {
    this.memoryService = memoryService;
    this.toolsService = toolsService;
    this.promptBuilder = new PromptBuilder();
    this.estimator = new TokenEstimator();
  }

  build({ userMessage, settings, toolMessages = [] }) {
    const relevantMemories = settings.longTermMemoryEnabled
      ? this.memoryService.longTermMemory.search(userMessage, settings.maxLongTermContextItems || 6)
      : [];
    const tools = settings.toolsEnabled ? this.toolsService.listForPrompt() : [];
    const systemPrompt = this.promptBuilder.buildSystemPrompt({ memories: relevantMemories, tools });
    const messages = [{ role: "system", content: systemPrompt }];
    const budget = Number(settings.contextTokenBudget) || 3500;
    const recent = this.memoryService.shortTermMemory.getMessages().slice().reverse();

    for (const item of [...toolMessages].reverse()) {
      messages.splice(1, 0, { role: "tool", content: item.content });
    }

    for (const message of recent) {
      const candidate = { role: normalizeRole(message.role), content: String(message.content || "") };
      const next = [messages[0], candidate, ...messages.slice(1)];
      if (this.estimator.estimateMessages(next) > budget) break;
      messages.splice(1, 0, candidate);
    }

    return {
      messages,
      memories: relevantMemories,
      estimatedTokens: this.estimator.estimateMessages(messages)
    };
  }
}

function normalizeRole(role) {
  return role === "assistant" || role === "system" || role === "tool" ? role : "user";
}
