export class MemoryScorer {
  score(memory, query) {
    const now = Date.now();
    const queryTerms = tokenize(query);
    const contentTerms = tokenize(`${memory.content} ${(memory.keywords || []).join(" ")}`);
    const overlap = queryTerms.filter((term) => contentTerms.includes(term)).length;
    const direct = queryTerms.some((term) => String(memory.content || "").toLowerCase().includes(term)) ? 0.2 : 0;
    const importance = Number(memory.importance || 0) * 0.25;
    const usage = Math.min(Number(memory.usageCount || 0) / 10, 1) * 0.15;
    const ageMs = now - new Date(memory.updatedAt || memory.createdAt || now).getTime();
    const recency = Math.max(0, 1 - ageMs / (1000 * 60 * 60 * 24 * 90)) * 0.15;
    const lexical = queryTerms.length ? Math.min(overlap / queryTerms.length, 1) * 0.45 : 0;
    return Number((lexical + direct + importance + usage + recency).toFixed(4));
  }
}

export function extractKeywords(text, limit = 10) {
  const stopwords = new Set(["para", "com", "que", "uma", "por", "como", "isso", "este", "esta", "the", "and", "for", "you", "are", "sobre", "deve", "meu", "minha"]);
  const counts = new Map();
  for (const term of tokenize(text)) {
    if (term.length < 3 || stopwords.has(term)) continue;
    counts.set(term, (counts.get(term) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([term]) => term);
}

export function tokenize(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g) || [];
}
