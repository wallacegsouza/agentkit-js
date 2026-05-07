const SECRET_PATTERN = /(sk-[a-z0-9_-]{12,}|bearer\s+[a-z0-9._-]{12,}|(?:api[_ -]?key|token|senha|password|secret)\s*[:=]\s*\S{6,})/i;

export function looksLikeSecret(text) {
  return SECRET_PATTERN.test(String(text || ""));
}

export function assertNoSecretText(...values) {
  const joined = values.map((value) => String(value || "")).join("\n");
  if (looksLikeSecret(joined)) {
    throw new Error("Conteúdo bloqueado porque parece conter API key, token, senha ou segredo.");
  }
}

export function limitString(value, maxLength, fieldName) {
  const text = String(value || "");
  if (text.length > maxLength) {
    throw new Error(`${fieldName} excede o limite de ${maxLength} caracteres.`);
  }
  return text;
}

export function joinUrl(baseUrl, path) {
  return `${String(baseUrl || "").replace(/\/+$/, "")}/${String(path || "").replace(/^\/+/, "")}`;
}

export function sanitizeFilename(name, fallback = "download.txt") {
  const cleaned = String(name || fallback).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return cleaned || fallback;
}
