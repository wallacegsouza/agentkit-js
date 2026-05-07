export class MemoryOptimizerRunTool {
  constructor({ memoryOptimizerProvider }) {
    this.memoryOptimizerProvider = memoryOptimizerProvider;
    this.name = "memory_optimizer_run";
    this.description = "Executa manualmente o sub-agente de otimização de memória.";
    this.parameters = {};
    this.sensitive = true;
  }

  async execute() {
    const optimizer = this.memoryOptimizerProvider?.();
    if (!optimizer) throw new Error("Otimizador de memória ainda não está disponível.");
    await optimizer.run();
    return { ran: true, finishedAt: new Date().toISOString() };
  }
}
