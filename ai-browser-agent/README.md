# AI Browser Agent

Aplicação web de chat com um agente de IA executando 100% no browser. O projeto usa HTML, JavaScript puro com ES Modules, Tailwind CSS via CDN e `localStorage` para memória curta e longa.

## Como executar

```bash
cd ai-browser-agent
npm run dev
```

Abra `http://localhost:4173`. Também é possível servir a pasta com qualquer servidor estático.

## Configuração de LLM

Abra **Configurações** no app. A API key, quando necessária, deve ser informada no campo próprio e fica apenas em memória durante a sessão atual. Ela é perdida ao recarregar a página e nunca é salva no `localStorage`, exportada, registrada em logs ou enviada para memória.

### Ollama

```txt
providerType: ollama
baseUrl: http://localhost:11434
chatPath: /api/chat
model: llama3.1
requiresApiKey: false
```

### OpenAI-compatible remoto

```txt
providerType: openai-compatible
baseUrl: https://api.openai.com/v1
chatPath: /chat/completions
model: gpt-4.1-mini
requiresApiKey: true
```

Informe a API key em **API key da sessão** antes de enviar mensagens.

### OpenAI-compatible local, incluindo LM Studio

```txt
providerType: openai-compatible
baseUrl: http://localhost:1234/v1
chatPath: /chat/completions
model: local-model
requiresApiKey: false
```

Não existe opção específica para `lm-studio`; use o provider `openai-compatible`.

### Custom

```txt
providerType: custom
baseUrl: http://localhost:8080
chatPath: /chat
model: my-model
requiresApiKey: false
```

Headers customizados simples podem ser configurados como JSON, mas headers sensíveis como `Authorization`, tokens, secrets e passwords são filtrados.

## Tailwind CSS

Tailwind é carregado via CDN no `index.html`:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Não há etapa de build obrigatória.

## Arquitetura

- `src/main.js`: composição da aplicação.
- `src/ui`: chat, modais, configurações, memória, ajuda e debug.
- `src/agent`: orquestração, montagem de contexto, prompt e tool calling.
- `src/llm`: serviço LLM, secrets runtime e providers.
- `src/memory`: memória curta, longa, scoring e sub-agente de otimização.
- `src/tools`: ferramentas do browser e registro.
- `src/storage`: repositórios sobre `localStorage`.
- `src/utils`: eventos, logs, JSON seguro, DOM, IDs e estimativa de tokens.

## Memória curta

A memória curta guarda a conversa recente em `aiAgent:shortTermMemory`, com `conversationId`, mensagens, roles, timestamp e metadados. Ela pode ser limpa, exportada e importada pela tela **Memórias**.

## Memória longa

A memória longa guarda fatos, preferências, decisões, tarefas, resumos e contexto em `aiAgent:longTermMemory`. A busca usa palavras-chave, correspondência de termos, recência, importância e frequência de uso. Embeddings externos não são usados nesta versão.

## Sub-agente de otimização

O `MemoryOptimizerAgent` roda de forma assíncrona após interações usando `requestIdleCallback` ou `setTimeout`. A estratégia local extrai memórias de frases como “lembre que”, “guarde”, “registre”, “prefiro” e “decidimos que”. A estratégia com LLM é opcional, pede JSON estruturado e ignora respostas inválidas.

## Context Builder

O `ContextBuilder` monta as mensagens enviadas ao provider com system prompt, memórias relevantes, histórico recente e lista de ferramentas. Um estimador simples limita o contexto por orçamento aproximado de tokens.

## Tools Service

Ferramentas disponíveis:

- `date_time`
- `calculator`
- `browser_info`
- `clipboard_read`
- `geolocation`
- `notification`
- `local_storage`

Ferramentas sensíveis exigem confirmação visual do usuário antes de executar.

## Tela de Help

A tela **Ajuda** explica como escrever prompts que geram memórias melhores, como registrar decisões, atualizar memórias, evitar mensagens vagas e proteger privacidade.

## Segurança da API key

Como a aplicação roda no browser, qualquer API key digitada pode ser vista no DevTools durante a sessão. Por isso:

- não é salva em `localStorage`;
- não é exportada;
- não é enviada para memória;
- não aparece nos logs;
- precisa ser informada novamente após recarregar a página.

## Limitações de segurança

Este é um app client-side. Não use segredos em mensagens. Providers remotos verão o conteúdo enviado no prompt. O `localStorage` pertence ao browser local e pode ser inspecionado por quem tiver acesso ao perfil do usuário.

## Roadmap sugerido

- Migrar memória para IndexedDB.
- Adicionar Web Worker para otimização de memória.
- Suportar function calling nativo por provider.
- Criar testes automatizados de UI.
- Adicionar import/export completo de configurações sem secrets.
- Melhorar ranking de memória com embeddings locais.
