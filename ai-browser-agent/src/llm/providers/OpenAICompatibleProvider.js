export class OpenAICompatibleProvider {
  async chat({ messages, config, secrets, signal }) {
    if (config.requiresApiKey && !secrets?.apiKey) {
      return missingApiKeyError();
    }

    const headers = { "Content-Type": "application/json" };
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
    if (!response.ok) return providerError(raw?.error?.message || response.statusText, raw);

    return {
      ok: true,
      content: raw?.choices?.[0]?.message?.content || "",
      raw,
      usage: {
        inputTokens: raw?.usage?.prompt_tokens ?? null,
        outputTokens: raw?.usage?.completion_tokens ?? null
      }
    };
  }
}

function missingApiKeyError() {
  return {
    ok: false,
    error: {
      message: "Este provider exige API key. Informe a API key para esta sessão antes de enviar mensagens.",
      code: "MISSING_API_KEY",
      details: {}
    }
  };
}

function providerError(message, details = {}) {
  return { ok: false, error: { message: message || "Erro do provider.", code: "PROVIDER_ERROR", details } };
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
