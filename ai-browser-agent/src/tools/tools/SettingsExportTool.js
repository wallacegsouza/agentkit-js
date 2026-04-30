export class SettingsExportTool {
  constructor({ settingsProvider }) {
    this.settingsProvider = settingsProvider;
    this.name = "settings_export";
    this.description = "Exporta configurações persistentes sem API key ou secrets runtime.";
    this.parameters = {};
    this.sensitive = true;
  }

  async execute() {
    const settings = this.settingsProvider();
    return {
      exportedAt: new Date().toISOString(),
      settings: sanitizeSettings(settings)
    };
  }
}

function sanitizeSettings(settings) {
  const { customHeaders, ...rest } = settings;
  const safeHeaders = Object.fromEntries(Object.entries(customHeaders || {}).filter(([name]) => {
    return !["authorization", "cookie", "x-api-key", "api-key", "token", "secret", "password"].includes(name.toLowerCase());
  }));
  return { ...rest, customHeaders: safeHeaders };
}
