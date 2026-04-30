import { limitString } from "./ToolSafety.js";

export class CsvParserTool {
  constructor() {
    this.name = "csv_parser";
    this.description = "Converte CSV simples para JSON com limite de tamanho.";
    this.parameters = { csv: "string", delimiter: "string opcional" };
    this.sensitive = false;
  }

  async execute(args = {}) {
    const csv = limitString(args.csv, 250000, "csv");
    const delimiter = String(args.delimiter || ",").slice(0, 1) || ",";
    const rows = parseCsv(csv, delimiter);
    if (!rows.length) return { headers: [], rows: [], count: 0 };
    const headers = rows[0].map((item, index) => item || `column_${index + 1}`);
    const data = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
    return { headers, rows: data, count: data.length };
  }
}

function parseCsv(csv, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((item) => item !== "")) rows.push(row);
  return rows;
}
