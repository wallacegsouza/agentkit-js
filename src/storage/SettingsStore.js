import { DEFAULT_SETTINGS } from "../llm/LLMService.js";

export class SettingsStore {
  constructor({ repository }) {
    this.repository = repository;
    this.settings = { ...DEFAULT_SETTINGS, ...this.repository.get("settings", {}) };
  }

  get() {
    return { ...this.settings, customHeaders: { ...(this.settings.customHeaders || {}) } };
  }

  set(next) {
    const safe = {
      ...DEFAULT_SETTINGS,
      ...next,
      customHeaders: filterHeaders(next.customHeaders || {})
    };
    this.settings = safe;
    this.repository.set("settings", safe);
  }
}

function filterHeaders(headers) {
  const blocked = ["authorization", "cookie", "x-api-key", "api-key", "token", "secret", "password"];
  return Object.fromEntries(Object.entries(headers).filter(([name]) => !blocked.includes(name.toLowerCase())));
}
