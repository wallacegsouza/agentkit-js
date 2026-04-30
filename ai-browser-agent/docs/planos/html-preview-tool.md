# Plano de Implementação: `html_preview`

## Objetivo

Criar uma tool sensível para renderizar conteúdo HTML, CSS e JavaScript gerado pelo agente em uma nova janela do browser, sem expor API key, memórias, configurações internas ou `localStorage` do app principal.

A tool deve permitir que o agente mostre protótipos, exemplos visuais, componentes, páginas estáticas e pequenas interações em um ambiente isolado.

## Nome e Contrato da Tool

Nome:

```txt
html_preview
```

Parâmetros:

```js
{
  title: "string opcional",
  html: "string obrigatório",
  css: "string opcional",
  js: "string opcional",
  allowScripts: "boolean opcional, default false"
}
```

Retorno em sucesso:

```js
{
  opened: true,
  title: "Preview",
  scriptsEnabled: false
}
```

Retorno em erro:

```js
{
  ok: false,
  tool: "html_preview",
  error: {
    message: "Erro legível",
    code: "HTML_PREVIEW_ERROR"
  }
}
```

## Decisões de Segurança

- A tool deve ser marcada como `sensitive: true`.
- Toda execução deve exigir confirmação visual via `ToolsService`.
- `allowScripts` deve ser `false` por padrão.
- Quando `allowScripts` for `true`, o texto de confirmação deve deixar claro que JavaScript gerado pelo modelo será executado.
- A janela aberta não deve receber API key, settings, memórias, logs ou qualquer referência ao estado interno do app.
- O preview deve ser autocontido.
- O preview deve usar um `iframe sandbox`.
- O sandbox não deve usar `allow-same-origin`.
- Para preview sem JavaScript, usar `sandbox=""`.
- Para preview com JavaScript, usar `sandbox="allow-scripts"`.
- Bloquear conteúdo com aparência de API key, token, senha ou segredo antes de renderizar.
- Não registrar o HTML, CSS ou JS completos nos logs.
- Registrar apenas metadados: tamanho dos campos, se scripts foram habilitados e se a janela abriu.

## Estratégia de Renderização

Implementar `src/tools/tools/HtmlPreviewTool.js`.

Fluxo:

1. Validar argumentos.
2. Normalizar `title`, `html`, `css`, `js` e `allowScripts`.
3. Recusar payloads vazios ou grandes demais.
4. Verificar padrões sensíveis no conteúdo.
5. Criar documento interno para `iframe srcdoc`.
6. Criar documento externo para a nova janela.
7. Abrir janela com `window.open("", "_blank", "noopener,noreferrer")`.
8. Escrever documento externo com aviso de segurança e o `iframe`.
9. Retornar status sem incluir o conteúdo completo.

Documento externo:

- Deve conter título.
- Deve conter um aviso fixo no topo: “Conteúdo gerado pelo agente em ambiente isolado.”
- Deve renderizar um `iframe` em tela cheia.
- Deve usar CSS mínimo inline.

Documento do iframe:

- Deve conter o HTML do usuário.
- Deve injetar CSS dentro de `<style>`.
- Deve injetar JS dentro de `<script>` apenas se `allowScripts === true`.

## Validações

- `html` deve ser string não vazia.
- `title` deve ter limite de tamanho, por exemplo 120 caracteres.
- `html`, `css` e `js` devem ter limite total, por exemplo 250 KB.
- Bloquear conteúdo com padrões como:
  - `sk-...`
  - `Bearer ...`
  - `token: ...`
  - `password: ...`
  - `secret: ...`
- Se `window.open` retornar `null`, mostrar erro explicando que o popup pode ter sido bloqueado.

## Integração

- Criar `src/tools/tools/HtmlPreviewTool.js`.
- Registrar em `src/tools/BrowserToolsRegistry.js`.
- A tool deve aparecer em `ToolsService.listForPrompt()`.
- Atualizar README depois que a implementação for concluída.
- Marcar o item como concluído em `docs/features/tools-checklist.md` após implementar.

## Prompt para o Agente

A descrição da tool deve orientar o LLM a usá-la somente quando o usuário pedir visualização, protótipo, componente, página ou resultado HTML.

Descrição sugerida:

```txt
Renderiza HTML, CSS e JavaScript opcional em uma nova janela isolada. Use somente quando o usuário pedir preview visual, protótipo ou exemplo interativo. JavaScript fica desabilitado por padrão.
```

## Testes Manuais

- Executar `npm run check:imports`.
- Abrir o app em `http://localhost:4173`.
- Pedir ao agente um preview HTML simples sem JS.
- Confirmar que a janela abre e renderiza o HTML/CSS.
- Pedir um preview com JS e confirmar que há aviso/confirm antes da execução.
- Confirmar que conteúdo com possível segredo é bloqueado.
- Confirmar que o preview não consegue acessar `localStorage` do app principal.
- Confirmar que logs não incluem HTML/CSS/JS completo.
- Confirmar que popup bloqueado gera erro legível.

## Exemplo de Chamada

```json
{
  "tool": "html_preview",
  "args": {
    "title": "Card de Produto",
    "html": "<main><h1>Produto</h1><button id='buy'>Comprar</button></main>",
    "css": "body { font-family: sans-serif; padding: 24px; } button { padding: 8px 12px; }",
    "js": "document.querySelector('#buy').addEventListener('click', () => alert('Compra simulada'));",
    "allowScripts": true
  }
}
```

## Critério de Pronto

- A tool abre uma nova janela com preview isolado.
- Scripts ficam desligados por padrão.
- Scripts exigem confirmação explícita.
- Conteúdo sensível é bloqueado.
- Nenhum segredo ou estado interno do app é passado ao preview.
- A tool está registrada no `BrowserToolsRegistry`.
- O checklist e README refletem a nova capacidade.
