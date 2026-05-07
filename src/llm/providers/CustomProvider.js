const SENSITIVE_HEADER_NAMES = ["authorization", "cookie", "x-api-key", "api-key", "token", "secret", "password"];

export class CustomProvider {
  async chat({ messages, config, secrets, signal }) {
    if (config.requiresApiKey && !secrets?.apiKey) {
      return {
        ok: false,
        error: {
          message: "Este provider exige API key. Informe a API key para esta sessão antes de enviar mensagens.",
          code: "MISSING_API_KEY",
          details: {}
        }
      };
    }

    const headers = { "Content-Type": "application/json", ...sanitizeHeaders(config.customHeaders) };
    if (config.requiresApiKey) headers.Authorization = `Bearer ${secrets.apiKey}`;

    const response = await fetch(joinUrl(config.baseUrl, config.chatPath), {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: Number(config.temperature),
        max_tokens: Number(config.maxTokens)
      })
    });

    const raw = await readJsonResponse(response);
    if (!response.ok) {
      return { ok: false, error: { message: raw?.error?.message || raw?.error || response.statusText, code: "PROVIDER_ERROR", details: raw } };
    }

    return {
      ok: true,
      content: raw?.choices?.[0]?.message?.content || raw?.message?.content || raw?.content || raw?.response || "",
      raw,
      usage: {
        inputTokens: raw?.usage?.prompt_tokens ?? null,
        outputTokens: raw?.usage?.completion_tokens ?? null
      }
    };
  }
}

export function sanitizeHeaders(headers = {}) {
  const output = {};
  for (const [name, value] of Object.entries(headers || {})) {
    if (!name || SENSITIVE_HEADER_NAMES.includes(name.toLowerCase())) continue;
    output[name] = String(value);
  }
  return output;
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { text };
  }
}

function joinUrl(baseUrl, path) {
  return `${String(baseUrl || "").replace(/\/+$/, "")}/${String(path || "").replace(/^\/+/, "")}`;
}
