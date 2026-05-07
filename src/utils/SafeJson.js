export function safeParseJson(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function safeStringify(value, spacing = 2) {
  try {
    return JSON.stringify(value, null, spacing);
  } catch {
    return "";
  }
}

export function parseJsonFromText(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const direct = safeParseJson(candidate, null);
  if (direct) return direct;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return safeParseJson(candidate.slice(first, last + 1), null);
  }
  return null;
}
