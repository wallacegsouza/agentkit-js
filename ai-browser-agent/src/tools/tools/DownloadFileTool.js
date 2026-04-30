import { assertNoSecretText, limitString, sanitizeFilename } from "./ToolSafety.js";

const MIME_TYPES = {
  ".txt": "text/plain",
  ".json": "application/json",
  ".md": "text/markdown"
};

export class DownloadFileTool {
  constructor() {
    this.name = "download_file";
    this.description = "Gera download de arquivo .txt, .json ou .md com conteúdo informado.";
    this.parameters = { filename: "string", content: "string", mimeType: "string opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const filename = sanitizeFilename(args.filename, "agent-output.txt");
    const extension = Object.keys(MIME_TYPES).find((item) => filename.toLowerCase().endsWith(item));
    if (!extension) throw new Error("Extensão não suportada. Use .txt, .json ou .md.");
    const content = limitString(args.content, 250000, "content");
    assertNoSecretText(content);
    const mimeType = args.mimeType || MIME_TYPES[extension];
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return { downloaded: true, filename, mimeType, bytes: blob.size };
  }
}
