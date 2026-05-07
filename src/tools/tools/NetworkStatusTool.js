export class NetworkStatusTool {
  constructor() {
    this.name = "network_status";
    this.description = "Retorna status online/offline e dados não sensíveis da conexão quando disponíveis.";
    this.parameters = {};
    this.sensitive = false;
  }

  async execute() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: connection?.saveData || false
    };
  }
}
