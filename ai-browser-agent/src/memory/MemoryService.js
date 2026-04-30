export class MemoryService {
  constructor({ shortTermMemory, longTermMemory, eventBus, logger }) {
    this.shortTermMemory = shortTermMemory;
    this.longTermMemory = longTermMemory;
    this.eventBus = eventBus;
    this.logger = logger;
  }

  addShortMessage(message) {
    const saved = this.shortTermMemory.addMessage(message);
    this.eventBus.emit("memory:short-changed", this.shortTermMemory.getMessages());
    return saved;
  }

  clearConversation() {
    this.shortTermMemory.clear();
    this.eventBus.emit("memory:short-changed", []);
  }

  createLongMemory(input) {
    const memory = this.longTermMemory.create(input);
    if (memory) {
      this.logger.info("Memória criada", { id: memory.id, type: memory.type });
      this.eventBus.emit("memory:long-changed", this.longTermMemory.list());
    }
    return memory;
  }

  updateLongMemory(id, patch) {
    const memory = this.longTermMemory.update(id, patch);
    if (memory) {
      this.logger.info("Memória atualizada", { id: memory.id, type: memory.type });
      this.eventBus.emit("memory:long-changed", this.longTermMemory.list());
    }
    return memory;
  }

  removeLongMemory(id) {
    this.longTermMemory.remove(id);
    this.eventBus.emit("memory:long-changed", this.longTermMemory.list());
  }
}
