const SECRET_PATTERNS = [
  /(sk-[A-Za-z0-9_-]{12,})/g,
  /(Bearer\s+)[A-Za-z0-9._-]+/gi,
  /("?(?:apiKey|token|secret|password|authorization)"?\s*:\s*")([^"]+)(")/gi
];

export class Logger {
  constructor({ repository, eventBus }) {
    this.repository = repository;
    this.eventBus = eventBus;
    this.debugEnabled = false;
    this.agentTraceEnabled = false;
    this.persistLogs = false;
    this.maxEntries = 120;
    this.entries = this.repository.get("logs", []);
  }

  configure({ debugEnabled = false, agentTraceEnabled = false, persistLogs = false } = {}) {
    this.debugEnabled = Boolean(debugEnabled);
    this.agentTraceEnabled = Boolean(agentTraceEnabled);
    this.persistLogs = Boolean(persistLogs);
  }

  trace(message, details = {}) {
    if (this.agentTraceEnabled) this.write("trace", message, details);
  }

  debug(message, details = {}) {
    if (this.debugEnabled) this.write("debug", message, details);
  }

  info(message, details = {}) {
    this.write("info", message, details);
  }

  warn(message, details = {}) {
    this.write("warn", message, details);
  }

  error(message, details = {}) {
    this.write("error", message, details);
  }

  write(level, message, details = {}) {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      level,
      message: this.mask(message),
      details: this.maskObject(details),
      createdAt: new Date().toISOString()
    };
    this.entries = [entry, ...this.entries].slice(0, this.maxEntries);
    if (this.persistLogs) this.repository.set("logs", this.entries);
    this.eventBus?.emit("logs:changed", this.entries);
  }

  getEntries() {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
    this.repository.remove("logs");
    this.eventBus?.emit("logs:changed", this.entries);
  }

  maskObject(value) {
    try {
      return JSON.parse(this.mask(JSON.stringify(value ?? {})));
    } catch {
      return {};
    }
  }

  mask(value) {
    let output = String(value ?? "");
    output = output.replace(SECRET_PATTERNS[0], "[masked-secret]");
    output = output.replace(SECRET_PATTERNS[1], "$1[masked-secret]");
    output = output.replace(SECRET_PATTERNS[2], '$1[masked-secret]$3');
    return output;
  }
}
