export class RuntimeSecrets {
  constructor() {
    this.apiKey = null;
  }

  setApiKey(value) {
    this.apiKey = value?.trim() || null;
  }

  getApiKey() {
    return this.apiKey;
  }

  clear() {
    this.apiKey = null;
  }
}
