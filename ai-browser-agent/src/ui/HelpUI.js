import { Modal } from "./Modal.js";

export class HelpUI {
  open() {
    const content = document.createElement("div");
    content.className = "space-y-5 text-sm leading-6 text-zinc-700";
    content.innerHTML = `
      <p>O agente usa memória curta para a conversa atual, memória longa para fatos úteis e um sub-agente de memória para curadoria assíncrona.</p>
      ${section("1. Como fazer o agente lembrar algo", [
        "Lembre que meu projeto atual usa JavaScript puro, Tailwind CSS e localStorage.",
        "Guarde como preferência: prefiro respostas objetivas, com exemplos de código quando necessário.",
        "Memorize esta decisão: não vamos salvar API keys no localStorage."
      ])}
      ${section("2. Como registrar decisões de projeto", [
        "Decidimos que a memória longa será armazenada no localStorage usando o prefixo aiAgent:.",
        "Registre como decisão técnica: o app não terá backend nesta primeira versão.",
        "Guarde esta arquitetura: Agent, ContextBuilder, LLMService, MemoryService e ToolsService devem ficar desacoplados."
      ])}
      ${section("3. Como fornecer contexto relevante", [
        "Contexto: estou criando um agente de IA client-side para rodar no browser, sem backend.",
        "Meu objetivo é criar uma aplicação simples, extensível e fácil de evoluir para IndexedDB no futuro.",
        "Considere que o usuário final pode usar Ollama localmente ou um endpoint OpenAI-compatible remoto."
      ])}
      ${section("4. Como atualizar uma memória existente", [
        "Atualize a memória sobre o provider: agora vamos suportar apenas openai-compatible, ollama e custom.",
        "Corrija a decisão anterior: a API key não deve ser persistida em nenhum storage.",
        "Substitua a preferência anterior por: usar Tailwind via CDN como opção padrão."
      ])}
      <section>
        <h3 class="mb-2 font-semibold text-zinc-950">5. Como evitar memórias ruins</h3>
        <p>Mensagens vagas como “Lembre disso.”, “Guarde essa ideia.” e “Isso é importante.” geram memórias ruins. Diga claramente o que deve ser lembrado, por que importa, se é fato, preferência, decisão, tarefa ou contexto, e se substitui algo anterior.</p>
      </section>
      <section>
        <h3 class="mb-2 font-semibold text-zinc-950">6. Tipos de memória suportados</h3>
        <p><code>fact</code>: fato estável. <code>preference</code>: preferência. <code>decision</code>: decisão técnica ou de produto. <code>task</code>: tarefa. <code>summary</code>: resumo consolidado. <code>context</code>: contexto útil.</p>
      </section>
      <section>
        <h3 class="mb-2 font-semibold text-zinc-950">7. Boas práticas de prompt para memória</h3>
        <ul class="list-disc pl-5">
          <li>Use “lembre”, “guarde”, “registre”, “memorize” ou “decidimos”.</li>
          <li>Informe contexto suficiente e prefira uma decisão por mensagem.</li>
          <li>Corrija memórias antigas quando algo mudar.</li>
          <li>Evite pedir para memorizar dados sensíveis.</li>
          <li>Não inclua API keys, senhas ou tokens em mensagens.</li>
          <li>Use nomes claros para projetos, módulos e decisões.</li>
          <li>Diferencie fatos, preferências e decisões.</li>
        </ul>
      </section>
      <section>
        <h3 class="mb-2 font-semibold text-zinc-950">8. Privacidade</h3>
        <p>A memória fica no localStorage do próprio browser, pode ser apagada pelo usuário e deve ser revisada periodicamente. A API key não é salva. Dados sensíveis não devem ser colocados em mensagens.</p>
      </section>
    `;
    new Modal({ title: "Ajuda para prompts de memória", content, width: "max-w-4xl" }).open();
  }
}

function section(title, examples) {
  return `
    <section>
      <h3 class="mb-2 font-semibold text-zinc-950">${title}</h3>
      <div class="space-y-2">
        ${examples.map((example) => `<pre class="overflow-auto rounded-md bg-zinc-100 p-3 text-xs text-zinc-800">${example}</pre>`).join("")}
      </div>
    </section>
  `;
}
