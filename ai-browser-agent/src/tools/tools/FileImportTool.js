export class FileImportTool {
  constructor() {
    this.name = "file_import";
    this.description = "Lê arquivo selecionado pelo usuário sem persistir automaticamente.";
    this.parameters = { accept: "string opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const accept = args.accept || ".txt,.json,.md,.csv,text/plain,application/json,text/markdown,text/csv";
    const file = await pickFile(accept);
    const text = await file.text();
    if (text.length > 500000) throw new Error("Arquivo excede o limite de 500 KB.");
    return {
      name: file.name,
      type: file.type || null,
      size: file.size,
      text
    };
  }
}

function pickFile(accept) {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) reject(new Error("Nenhum arquivo selecionado."));
      else resolve(file);
    }, { once: true });
    input.click();
  });
}
