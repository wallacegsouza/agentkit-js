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
    this.startedAtMs = Date.now();
    this.lastEntryAtMs = this.entriesNewestTimestamp(this.repository.get("logs", [])) || this.startedAtMs;
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
    const nowMs = Date.now();
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      level,
      message: this.mask(message),
      details: this.maskObject(details),
      createdAt: new Date(nowMs).toISOString(),
      timing: {
        sinceStartMs: Math.max(0, nowMs - this.startedAtMs),
        sincePreviousMs: Math.max(0, nowMs - this.lastEntryAtMs)
      }
    };
    this.lastEntryAtMs = nowMs;
    this.entries = [entry, ...this.entries].slice(0, this.maxEntries);
    if (this.persistLogs) this.repository.set("logs", this.entries);
    this.eventBus?.emit("logs:changed", this.entries);
  }

  getEntries() {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
    this.startedAtMs = Date.now();
    this.lastEntryAtMs = this.startedAtMs;
    this.repository.remove("logs");
    this.eventBus?.emit("logs:changed", this.entries);
  }

  entriesNewestTimestamp(entries) {
    const newest = entries?.[0]?.createdAt;
    const time = newest ? new Date(newest).getTime() : null;
    return Number.isFinite(time) ? time : null;
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
