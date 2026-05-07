export class ClipboardTool {
  constructor() {
    this.name = "clipboard_read";
    this.description = "Lê texto do clipboard, exigindo permissão e confirmação do usuário.";
    this.parameters = {};
    this.sensitive = true;
  }

  async execute() {
    if (!navigator.clipboard?.readText) throw new Error("Clipboard API indisponível.");
    const text = await navigator.clipboard.readText();
    return { text };
  }
}
