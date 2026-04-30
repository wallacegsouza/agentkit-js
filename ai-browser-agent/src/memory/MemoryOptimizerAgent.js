import { parseJsonFromText } from "../utils/SafeJson.js";
import { extractKeywords } from "./MemoryScorer.js";
import { looksSensitive } from "./LongTermMemory.js";

const RULES = [
  { type: "decision", pattern: /(?:decidimos que|memorize esta decisão:|registre como decisão técnica:|corrija a decisão anterior:)\s*(.+)/i },
  { type: "preference", pattern: /(?:prefiro|guarde como preferência:|substitua a preferência anterior por:)\s*(.+)/i },
  { type: "fact", pattern: /(?:lembre que|memorize|meu nome é)\s*(.+)/i },
  { type: "context", pattern: /(?:contexto:|estou trabalhando em|guarde esta arquitetura:)\s*(.+)/i },
  { type: "task", pattern: /(?:tarefa:|pendência:|preciso)\s*(.+)/i }
];

export class MemoryOptimizerAgent {
  constructor({ memoryService, llmService, runtimeSecrets, settingsProvider, logger }) {
    this.memoryService = memoryService;
    this.llmService = llmService;
    this.runtimeSecrets = runtimeSecrets;
    this.settingsProvider = settingsProvider;
    this.logger = logger;
    this.pending = false;
  }

  schedule() {
    const settings = this.settingsProvider();
    if (!settings.asyncMemoryOptimizationEnabled || this.pending) return;
    this.pending = true;
    const run = () => this.run().finally(() => (this.pending = false));
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 3000 });
    } else {
      window.setTimeout(run, 250);
    }
  }

  async run() {
    const settings = this.settingsProvider();
    if (!settings.longTermMemoryEnabled) return;
    this.logger.debug("Otimização assíncrona iniciada");
    const recentMessages = this.memoryService.shortTermMemory.getMessages().slice(-8);
    const createdLocal = this.runLocalStrategy(recentMessages);

    if (settings.llmMemoryOptimizationEnabled) {
      await this.runLlmStrategy(recentMessages, settings);
    }

    this.logger.debug("Otimização assíncrona finalizada", { createdLocal });
  }

  runLocalStrategy(messages) {
    let created = 0;
    for (const message of messages.filter((item) => item.role === "user")) {
      if (looksSensitive(message.content)) continue;
      for (const rule of RULES) {
        const match = message.content.match(rule.pattern);
        if (!match?.[1]) continue;
        const content = match[1].trim().replace(/[.!?]*$/, ".");
        if (content.length < 8) continue;
        const existing = this.memoryService.longTermMemory.list().find((item) => item.content.toLowerCase() === content.toLowerCase());
        if (existing) continue;
        const memory = this.memoryService.createLongMemory({
          type: rule.type,
          content,
          keywords: extractKeywords(content),
          importance: rule.type === "decision" ? 0.85 : 0.65,
          confidence: 0.7,
          sourceMessageIds: [message.id]
        });
        if (memory) created += 1;
        break;
      }
    }
    return created;
  }

  async runLlmStrategy(messages, settings) {
    const userMessages = messages.filter((item) => item.role === "user").map((item) => ({ id: item.id, content: item.content }));
    if (!userMessages.length) return;
    const prompt = [
      {
        role: "system",
        content: "Extraia memórias úteis de mensagens do usuário. Responda somente JSON no formato {\"memories\":[{\"type\":\"fact|preference|decision|task|summary|context\",\"content\":\"...\",\"importance\":0.0,\"confidence\":0.0,\"sourceMessageIds\":[\"...\"]}]}. Ignore dados sensíveis como API keys, tokens, senhas e segredos."
      },
      { role: "user", content: JSON.stringify(userMessages) }
    ];
    const result = await this.llmService.chat({
      messages: prompt,
      config: settings,
      secrets: { apiKey: this.runtimeSecrets.getApiKey() }
    });
    if (!result.ok) return;
    const parsed = parseJsonFromText(result.content);
    const memories = parsed?.memories;
    if (!Array.isArray(memories)) return;
    for (const item of memories.slice(0, 6)) {
      if (!item?.content || looksSensitive(item.content)) continue;
      this.memoryService.createLongMemory({
        type: item.type,
        content: item.content,
        keywords: extractKeywords(item.content),
        importance: item.importance,
        confidence: item.confidence,
        sourceMessageIds: item.sourceMessageIds || []
      });
    }
  }
}
