import { limitString } from "./ToolSafety.js";

export class PromptDebuggerTool {
  constructor() {
    this.name = "prompt_debugger";
    this.description = "Analisa um prompt localmente e sugere melhorias objetivas.";
    this.parameters = { prompt: "string" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const prompt = limitString(args.prompt, 20000, "prompt");
    const suggestions = [];
    if (prompt.length < 20) suggestions.push("Adicione mais contexto e objetivo.");
    if (!/[?.!]$/.test(prompt.trim())) suggestions.push("Finalize com uma solicitação clara.");
    if (!/(contexto|objetivo|restri|formato|exemplo|decidimos|lembre)/i.test(prompt)) suggestions.push("Inclua contexto, formato esperado ou exemplos.");
    if (/(isso|aquilo|coisa|ideia)$/i.test(prompt.trim())) suggestions.push("Substitua referências vagas por nomes concretos.");
    return {
      characters: prompt.length,
      words: prompt.trim().split(/\s+/).filter(Boolean).length,
      suggestions: suggestions.length ? suggestions : ["Prompt está claro o suficiente para uma primeira resposta."]
    };
  }
}
