import { assertNoSecretText, limitString } from "./ToolSafety.js";

export class ClipboardWriteTool {
  constructor() {
    this.name = "clipboard_write";
    this.description = "Escreve texto no clipboard com confirmação visual do usuário.";
    this.parameters = { text: "string" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API indisponível.");
    const text = limitString(args.text, 100000, "text");
    assertNoSecretText(text);
    await navigator.clipboard.writeText(text);
    return { written: true, characters: text.length };
  }
}
