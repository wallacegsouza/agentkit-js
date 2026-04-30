import { safeParseJson } from "../utils/SafeJson.js";

const FORBIDDEN_STORAGE_KEY_PARTS = ["apikey", "api_key", "token", "secret", "password", "senha", "authorization", "auth"];
const FORBIDDEN_FIELD_NAMES = new Set(["apikey", "api_key", "token", "secret", "password", "senha", "authorization", "auth", "bearer"]);
const SECRET_VALUE_PATTERN = /(sk-[a-z0-9_-]{12,}|bearer\s+[a-z0-9._-]{12,}|(?:password|senha|token|secret)\s*[:=]\s*\S{6,})/i;

export class LocalStorageRepository {
  constructor({ prefix = "aiAgent:" } = {}) {
    this.prefix = prefix;
  }

  key(name) {
    const normalized = String(name || "").replace(/^aiAgent:/, "");
    const lower = normalized.toLowerCase();
    if (FORBIDDEN_STORAGE_KEY_PARTS.some((part) => lower.includes(part))) {
      throw new Error(`Storage key blocked because it may contain sensitive data: ${normalized}`);
    }
    return `${this.prefix}${normalized}`;
  }

  get(name, fallback = null) {
    const raw = localStorage.getItem(this.key(name));
    if (raw === null) return fallback;
    return safeParseJson(raw, fallback);
  }

  set(name, value) {
    this.assertNoSecrets(value);
    localStorage.setItem(this.key(name), JSON.stringify(value));
  }

  remove(name) {
    localStorage.removeItem(this.key(name));
  }

  listKeys() {
    return Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));
  }

  assertNoSecrets(value) {
    if (containsSecret(value)) {
      throw new Error("Blocked attempt to persist sensitive data in localStorage.");
    }
  }
}

function containsSecret(value) {
  if (value == null) return false;
  if (typeof value === "string") return SECRET_VALUE_PATTERN.test(value);
  if (typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSecret);
  return Object.entries(value).some(([key, nested]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (FORBIDDEN_FIELD_NAMES.has(normalized)) return true;
    return containsSecret(nested);
  });
}
