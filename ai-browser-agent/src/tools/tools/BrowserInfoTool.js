export class BrowserInfoTool {
  constructor() {
    this.name = "browser_info";
    this.description = "Retorna informações básicas e não sensíveis do browser.";
    this.parameters = {};
    this.sensitive = false;
  }

  async execute() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
  }
}
