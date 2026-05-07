export class DateTimeTool {
  constructor() {
    this.name = "date_time";
    this.description = "Retorna data, hora, timezone e locale atuais do browser.";
    this.parameters = {};
    this.sensitive = false;
  }

  async execute() {
    const now = new Date();
    return {
      iso: now.toISOString(),
      local: now.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language
    };
  }
}
