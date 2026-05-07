import { createId } from "../utils/IdGenerator.js";

export class ShortTermMemory {
  constructor({ repository, maxMessages = 24 }) {
    this.repository = repository;
    this.maxMessages = maxMessages;
    this.state = this.repository.get("shortTermMemory", {
      conversationId: createId("conv"),
      messages: []
    });
  }

  setMaxMessages(value) {
    this.maxMessages = Number(value) || this.maxMessages;
    this.trim();
  }

  addMessage({ role, content, metadata = {} }) {
    const message = {
      id: createId("msg"),
      role,
      content,
      metadata,
      createdAt: new Date().toISOString()
    };
    this.state.messages.push(message);
    this.trim();
    this.save();
    return message;
  }

  getMessages() {
    return [...this.state.messages];
  }

  clear() {
    this.state = { conversationId: createId("conv"), messages: [] };
    this.save();
  }

  export() {
    return { ...this.state, exportedAt: new Date().toISOString() };
  }

  import(data) {
    if (!data || !Array.isArray(data.messages)) throw new Error("JSON de conversa inválido.");
    this.state = {
      conversationId: data.conversationId || createId("conv"),
      messages: data.messages.filter((message) => ["user", "assistant", "system", "tool"].includes(message.role))
    };
    this.trim();
    this.save();
  }

  trim() {
    this.state.messages = this.state.messages.slice(-this.maxMessages);
  }

  save() {
    this.repository.set("shortTermMemory", this.state);
  }
}
