# AI Browser Agent

Aplicação web de chat com um agente de IA executando inteiramente no browser. O projeto usa HTML, JavaScript puro, ES Modules, Tailwind CSS via CDN e `localStorage` para memória curta, memória longa e configurações não sensíveis.

O objetivo é servir como uma base simples e evolutiva para agentes client-side com LLM configurável, memória local, ferramentas do browser e uma interface limpa de chat.

## Principais Recursos

- Chat responsivo com mensagens de usuário, agente, sistema e ferramentas.
- Configuração de providers `openai-compatible`, `ollama` e `custom`.
- API key mantida apenas em memória durante a sessão.
- Memória curta em `localStorage` para histórico recente.
- Memória longa em `localStorage` para fatos, preferências, decisões, tarefas, resumos e contexto.
- Sub-agente assíncrono para extrair e consolidar memórias.
- Context Builder para montar o prompt enviado ao LLM.
- Tools Service para expor APIs do browser como ferramentas controladas.
- Tela de ajuda com boas práticas para prompts de memória.
- Painel opcional de debug com logs mascarados.

## Stack

- HTML
- CSS
- JavaScript puro
- ES Modules
- APIs nativas do browser
- `localStorage`
- Tailwind CSS via CDN

Não usa React, Vue, Angular, Svelte, TypeScript, backend próprio ou banco externo.

## Como Executar

Requisitos:

- Browser moderno.
- Python 3 disponível no terminal, usado apenas para servir arquivos estáticos.

```bash
cd ai-browser-agent
npm run dev
```

Abra:

```txt
http://localhost:4173
```

Também é possível servir a pasta com qualquer servidor estático.

## Scripts

```bash
npm run dev
```

Inicia um servidor estático com `python3 -m http.server 4173`.

```bash
npm run check:imports
```

Valida imports relativos dos módulos JavaScript.

## Configuração de LLM

Abra **Configurações** na interface. As configurações comuns são salvas em `localStorage`, mas a API key não é salva.

### Ollama

```txt
providerType: ollama
baseUrl: http://localhost:11434
chatPath: /api/chat
model: llama3.1
requiresApiKey: false
```

Certifique-se de que o Ollama esteja rodando localmente e que o modelo exista.

### OpenAI-compatible Remoto

```txt
providerType: openai-compatible
baseUrl: https://api.openai.com/v1
chatPath: /chat/completions
model: gpt-4.1-mini
requiresApiKey: true
```

Informe a API key no campo **API key da sessão**. Ela será usada somente até a página ser recarregada ou fechada.

### OpenAI-compatible Local

```txt
providerType: openai-compatible
baseUrl: http://localhost:1234/v1
chatPath: /chat/completions
model: local-model
requiresApiKey: false
```

Use essa opção para endpoints locais compatíveis com Chat Completions, incluindo LM Studio. Não existe provider específico chamado `lm-studio`.

### Custom

```txt
providerType: custom
baseUrl: http://localhost:8080
chatPath: /chat
model: my-model
requiresApiKey: false
```

O provider custom aceita headers simples em JSON. Headers sensíveis, como `Authorization`, tokens, secrets e passwords, são filtrados antes de persistir.

## Segurança da API Key

Como a aplicação roda no browser, qualquer API key digitada pode ser vista no DevTools durante a sessão. Por isso, a aplicação aplica estas regras:

- A API key não é salva em `localStorage`.
- A API key não é exportada.
- A API key não é registrada em logs.
- A API key não entra em memória curta ou longa.
- A API key não é incluída no contexto enviado ao LLM.
- A API key precisa ser informada novamente após recarregar a página.

A API key fica em `RuntimeSecrets`, apenas como estado runtime.

## Tailwind CSS

Tailwind é carregado via CDN em `index.html`:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Isso mantém o projeto sem etapa obrigatória de build.

## Estrutura do Projeto

```txt
ai-browser-agent/
  index.html
  README.md
  package.json
  docs/
    features/
      tools-checklist.md
  scripts/
    check-imports.mjs
  src/
    main.js
    styles/
      main.css
    ui/
    agent/
    llm/
    memory/
    tools/
    storage/
    utils/
```

## Arquitetura

`src/main.js` compõe a aplicação: cria storage, settings, logger, runtime secrets, memórias, tools, LLM service, agente e componentes de UI.

Camadas principais:

- `src/ui`: interface de chat, configurações, memória, ajuda, debug, modal e toast.
- `src/agent`: orquestração do agente, montagem de contexto e chamada de tools.
- `src/llm`: serviço LLM, secrets runtime e providers.
- `src/memory`: memória curta, memória longa, scoring e otimização.
- `src/tools`: tools do browser e registro.
- `src/storage`: repositórios sobre `localStorage`.
- `src/utils`: eventos, logs, JSON seguro, DOM, IDs e estimativa de tokens.

## Fluxo Principal

1. O usuário envia uma mensagem.
2. `Agent` salva a mensagem na memória curta.
3. `ContextBuilder` busca memórias longas relevantes.
4. `ContextBuilder` monta system prompt, histórico recente e tools disponíveis.
5. `LLMService` chama o provider configurado.
6. Se a resposta solicitar tool via JSON, `ToolCallingEngine` executa a tool.
7. O agente envia o resultado da tool ao LLM para resposta final.
8. A resposta é salva na memória curta.
9. `MemoryOptimizerAgent` roda em background para curadoria de memória longa.

## Memória Curta

A memória curta fica em:

```txt
aiAgent:shortTermMemory
```

Ela armazena:

- ID da conversa.
- Mensagens recentes.
- Role: `user`, `assistant`, `system` ou `tool`.
- Timestamp.
- Conteúdo.
- Metadados opcionais.

A tela **Memórias** permite visualizar, exportar, importar e limpar a conversa.

## Memória Longa

A memória longa fica em:

```txt
aiAgent:longTermMemory
```

Tipos suportados:

- `fact`
- `preference`
- `decision`
- `task`
- `summary`
- `context`

A busca usa uma pontuação simples baseada em palavras-chave, correspondência direta, recência, importância e frequência de uso. Esta versão não usa embeddings externos.

## Sub-agente de Memória

`MemoryOptimizerAgent` roda de forma assíncrona usando `requestIdleCallback` quando disponível, ou `setTimeout` como fallback.

Estratégia local:

- Detecta frases como “lembre que”, “guarde”, “registre”, “memorize”, “prefiro” e “decidimos que”.
- Extrai palavras-chave.
- Cria memórias simples.
- Evita salvar conteúdo com aparência de segredo.

Estratégia com LLM:

- Opcional.
- Pede JSON estruturado ao LLM.
- Valida a resposta antes de salvar.
- Usa a estratégia local como fallback.

## Context Builder

`ContextBuilder` monta as mensagens enviadas ao LLM com:

- System prompt principal.
- Memórias longas relevantes.
- Histórico recente.
- Definições de tools disponíveis.
- Resultados de tools quando aplicável.

Ele usa `TokenEstimator` para respeitar um orçamento aproximado de tokens.

## Tools Service

Tools implementadas:

- `date_time`: data, hora, timezone e locale.
- `calculator`: expressões aritméticas simples sem `eval`.
- `browser_info`: informações básicas do browser.
- `clipboard_read`: leitura do clipboard com confirmação.
- `geolocation`: localização aproximada com confirmação.
- `notification`: notificação local com confirmação.
- `local_storage`: leitura/listagem/remoção no namespace `aiAgent:*` com confirmação.

Ferramentas sensíveis exigem confirmação visual do usuário.

O checklist de próximas tools fica em:

```txt
docs/features/tools-checklist.md
```

## Tela de Ajuda

A tela **Ajuda** explica como escrever prompts melhores para memória, incluindo:

- Como fazer o agente lembrar algo.
- Como registrar decisões de projeto.
- Como fornecer contexto relevante.
- Como atualizar uma memória existente.
- Como evitar memórias ruins.
- Tipos de memória suportados.
- Boas práticas.
- Privacidade.

## Debug e Logs

O logger suporta:

- `debug`
- `info`
- `warn`
- `error`

Logs podem aparecer na interface quando debug estiver habilitado. O logger mascara padrões comuns de segredo e não deve receber API keys.

## Namespace do localStorage

Todas as chaves persistidas usam:

```txt
aiAgent:
```

Exemplos:

```txt
aiAgent:settings
aiAgent:shortTermMemory
aiAgent:longTermMemory
aiAgent:logs
```

O repositório bloqueia chaves de storage com nomes sensíveis e rejeita valores com aparência de segredo.

## Limitações

- Por ser client-side, chamadas a providers remotos dependem de CORS.
- API keys digitadas no browser podem ser vistas no DevTools durante a sessão.
- `localStorage` pode ser inspecionado por quem tiver acesso ao perfil do browser.
- A estratégia local de memória é heurística e simples.
- Não há embeddings ou banco vetorial nesta versão.
- Function calling nativo ainda não foi implementado.

## Troubleshooting

### A chamada ao provider remoto falha

Verifique CORS, `baseUrl`, `chatPath`, modelo, timeout e API key da sessão.

### Ollama não responde

Confirme que o Ollama está rodando:

```bash
ollama list
```

E que a URL configurada é:

```txt
http://localhost:11434
```

### A API key sumiu após recarregar

Esse é o comportamento esperado. A key é mantida apenas em memória durante a sessão.

### Uma memória não foi criada

O sub-agente evita mensagens vagas e conteúdo com aparência de segredo. Use prompts explícitos como:

```txt
Lembre que meu projeto usa JavaScript puro, Tailwind CSS e localStorage.
```

## Roadmap

- Migrar memória para IndexedDB.
- Adicionar Web Worker para otimização de memória.
- Implementar function calling nativo por provider.
- Criar testes automatizados de UI.
- Adicionar import/export completo de configurações sem secrets.
- Melhorar ranking de memória com embeddings locais.
- Implementar as tools priorizadas em `docs/features/tools-checklist.md`.
