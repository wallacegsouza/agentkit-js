# Checklist de Implementação de Tools

Este checklist organiza novas tools para o AI Browser Agent. Os primeiros itens são os próximos passos recomendados por trazerem mais valor imediato com baixa complexidade.

## Próximos Passos Prioritários

- [ ] `provider_health_check`
  - Testar se o provider configurado responde no endpoint atual.
  - Validar `baseUrl`, `chatPath`, timeout e bloqueio quando API key obrigatória estiver ausente.
  - Exibir resultado legível na UI sem registrar API key em logs.

- [ ] `ollama_models`
  - Listar modelos locais do Ollama via `GET /api/tags`.
  - Funcionar somente quando o provider ou base URL indicar Ollama/local.
  - Permitir ao usuário copiar ou aplicar o nome do modelo nas configurações.

- [ ] `memory_search`
  - Buscar memórias longas relevantes para um texto informado.
  - Retornar tipo, conteúdo, keywords, score e metadados de uso quando debug estiver ativo.
  - Nunca retornar dados sensíveis.

- [ ] `clipboard_write`
  - Escrever texto no clipboard.
  - Exigir confirmação visual do usuário antes de executar.
  - Retornar apenas status e tamanho do texto escrito, não o conteúdo completo em logs.

- [ ] `download_file`
  - Gerar download de arquivos `.txt`, `.json` e `.md`.
  - Validar nome, extensão e tipo MIME.
  - Bloquear conteúdo com aparência de API key, token, senha ou segredo.

- [ ] `json_validator`
  - Validar JSON informado pelo usuário.
  - Retornar JSON formatado, erro com linha aproximada quando possível e estatísticas básicas.
  - Não persistir o conteúdo automaticamente.

- [ ] `context_preview`
  - Mostrar o contexto que seria enviado ao LLM.
  - Incluir system prompt, memórias relevantes, histórico recente e tools disponíveis.
  - Garantir que API key e secrets nunca apareçam no preview.

- [ ] `html_preview`
  - Renderizar HTML/CSS/JS gerado pelo agente em uma nova janela.
  - Usar `iframe sandbox` e manter JavaScript desabilitado por padrão.
  - Exigir confirmação visual, bloquear possíveis segredos e não expor estado interno do app.
  - Plano: `docs/planos/html-preview-tool.md`.

## Tools de Baixo Risco

- [x] `date_time`
  - Retorna data, hora, timezone e locale atuais.

- [x] `calculator`
  - Calcula expressões aritméticas simples sem `eval`.

- [x] `browser_info`
  - Retorna informações básicas e não sensíveis do browser.

- [ ] `page_info`
  - Retornar URL atual, título da página e dimensões da viewport.
  - Evitar leitura de conteúdo completo da página por padrão.

- [ ] `text_formatter`
  - Limpar espaços, normalizar quebras de linha e converter caixa de texto.
  - Operar somente sobre texto informado explicitamente pelo usuário.

- [ ] `uuid_generator`
  - Gerar UUIDs ou IDs com prefixo configurável.
  - Não precisar de confirmação.

- [ ] `token_estimator`
  - Estimar tokens de um texto ou conjunto de mensagens.
  - Reutilizar `TokenEstimator`.

- [ ] `regex_tester`
  - Testar uma expressão regular sobre texto informado pelo usuário.
  - Proteger contra padrões muito pesados com limite de tamanho e timeout simples.

## Tools de Memória e Dados Locais

- [ ] `memory_create`
  - Criar memória longa manualmente com `type`, `content`, `importance` e `keywords`.
  - Validar tipos permitidos e bloquear dados sensíveis.

- [ ] `memory_update`
  - Atualizar memória longa existente.
  - Registrar log sem conteúdo sensível.

- [ ] `memory_delete`
  - Apagar memória específica por ID.
  - Exigir confirmação visual.

- [ ] `conversation_export`
  - Exportar conversa atual em JSON.
  - Garantir que export não contenha API key, tokens, senhas ou headers sensíveis.

- [ ] `settings_export`
  - Exportar configurações persistentes sem secrets.
  - Remover qualquer campo sensível antes do download.

- [ ] `local_storage_inspector`
  - Listar apenas chaves `aiAgent:*`.
  - Exigir confirmação para leitura ou remoção.

## Tools de Produtividade

- [x] `clipboard_read`
  - Lê texto do clipboard com confirmação e permissão do browser.

- [ ] `html_preview`
  - Abrir preview visual em janela separada para protótipos, componentes e exemplos HTML.
  - Tratar como tool sensível.
  - Usar o plano de implementação em `docs/planos/html-preview-tool.md`.

- [ ] `file_import`
  - Ler arquivo selecionado pelo usuário via `<input type="file">`.
  - Suportar `.txt`, `.json`, `.md` e `.csv`.
  - Não persistir automaticamente.

- [ ] `markdown_to_html`
  - Converter Markdown simples para HTML seguro.
  - Evitar HTML bruto não sanitizado.

- [ ] `csv_parser`
  - Converter CSV para JSON.
  - Limitar tamanho do arquivo/texto para evitar travamento da UI.

- [ ] `table_formatter`
  - Transformar listas ou JSON em tabela Markdown.
  - Validar entrada antes de formatar.

## Browser APIs Sensíveis

- [x] `geolocation`
  - Solicita localização aproximada com confirmação e permissão do browser.

- [x] `notification`
  - Mostra notificação local com confirmação e permissão do browser.

- [ ] `speech_synthesis`
  - Ler respostas em voz alta usando Web Speech API.
  - Permitir parar a leitura.

- [ ] `speech_recognition`
  - Capturar ditado por voz quando disponível no browser.
  - Exigir ação explícita do usuário para iniciar.

- [ ] `camera_check`
  - Verificar disponibilidade de câmera sem capturar imagem por padrão.
  - Exigir confirmação antes de qualquer acesso a mídia.

- [ ] `network_status`
  - Retornar online/offline e informações não sensíveis da conexão quando disponíveis.

## Tools para Orquestração do Agente

- [ ] `prompt_debugger`
  - Analisar prompt atual e sugerir melhorias.
  - Rodar localmente quando possível; usar LLM apenas se configurado.

- [ ] `memory_optimizer_run`
  - Executar manualmente o `MemoryOptimizerAgent`.
  - Mostrar resumo das memórias criadas, atualizadas ou ignoradas.

- [ ] `tool_list`
  - Listar ferramentas disponíveis, parâmetros, sensibilidade e status.
  - Refletir a flag global de tools habilitadas.

## Critérios Gerais para Cada Tool

- [ ] Registrar a tool no `BrowserToolsRegistry`.
- [ ] Implementar classe em `src/tools/tools`.
- [ ] Definir `name`, `description`, `parameters` e `sensitive`.
- [ ] Validar argumentos antes da execução.
- [ ] Retornar `{ ok, tool, data }` ou erro padronizado via `ToolsService`.
- [ ] Exigir confirmação visual para qualquer ação sensível.
- [ ] Não salvar nem logar API keys, tokens, senhas, secrets ou headers sensíveis.
- [ ] Adicionar documentação curta no README quando a tool virar estável.
- [ ] Validar imports com `npm run check:imports`.
