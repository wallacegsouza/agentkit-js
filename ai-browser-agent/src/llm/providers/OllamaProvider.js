export class OllamaProvider {
  async chat({ messages, config, signal }) {
    const response = await fetch(joinUrl(config.baseUrl, config.chatPath), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false,
        options: {
          temperature: Number(config.temperature)
        }
      })
    });

    const raw = await readJsonResponse(response);
    if (!response.ok) {
      return { ok: false, error: { message: raw?.error || response.statusText, code: "PROVIDER_ERROR", details: raw } };
    }

    return {
      ok: true,
      content: raw?.message?.content || raw?.response || "",
      raw,
      usage: {
        inputTokens: raw?.prompt_eval_count ?? null,
        outputTokens: raw?.eval_count ?? null
      }
    };
  }
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
