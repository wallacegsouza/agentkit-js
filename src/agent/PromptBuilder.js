export const BASE_SYSTEM_PROMPT = `Você é um agente de IA executando em um browser.
Você possui memória curta, memória longa e acesso controlado a ferramentas do browser.
Use ferramentas somente quando necessário.
Não invente resultados de ferramentas.
Quando uma ferramenta exigir permissão do usuário, explique antes.
Preserve privacidade e evite salvar dados sensíveis sem confirmação.
Nunca solicite, registre, memorize ou exponha API keys, tokens, senhas ou segredos.`;

export class PromptBuilder {
  buildSystemPrompt({ memories = [], tools = [] }) {
    const memoryBlock = memories.length
      ? `\n\nMemórias longas relevantes:\n${memories.map((item) => `- [${item.type}] ${item.content}`).join("\n")}`
      : "\n\nSem memórias longas relevantes para esta mensagem.";
    const toolBlock = tools.length
      ? `\n\nFerramentas disponíveis:\n${tools.map((tool) => `- ${tool.name}: ${tool.description}. Parâmetros: ${JSON.stringify(tool.parameters)}`).join("\n")}\n\nPara solicitar uma ferramenta, responda com JSON em uma linha no formato: {"tool":"date_time","args":{}}.`
      : "\n\nFerramentas desabilitadas.";
    return `${BASE_SYSTEM_PROMPT}${memoryBlock}${toolBlock}`;
  }
}
