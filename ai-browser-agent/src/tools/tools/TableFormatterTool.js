import { limitString } from "./ToolSafety.js";

export class TableFormatterTool {
  constructor() {
    this.name = "table_formatter";
    this.description = "Transforma listas ou JSON em tabela Markdown.";
    this.parameters = { data: "array|string JSON" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const data = Array.isArray(args.data) ? args.data : JSON.parse(limitString(args.data, 200000, "data"));
    if (!Array.isArray(data) || !data.length) throw new Error("Informe um array não vazio.");
    const rows = data.map((item) => typeof item === "object" && item !== null ? item : { value: item });
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const markdown = [
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => "---").join(" | ")} |`,
      ...rows.map((row) => `| ${headers.map((header) => cell(row[header])).join(" | ")} |`)
    ].join("\n");
    return { markdown, rows: rows.length, columns: headers.length };
  }
}

function cell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}
