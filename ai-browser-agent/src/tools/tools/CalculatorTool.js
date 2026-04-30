export class CalculatorTool {
  constructor() {
    this.name = "calculator";
    this.description = "Calcula expressões aritméticas simples com números e operadores + - * / % ( ).";
    this.parameters = { expression: "string" };
    this.sensitive = false;
  }

  async execute(args) {
    const expression = String(args.expression || "");
    if (!/^[0-9+\-*/%.(),\s]+$/.test(expression)) {
      throw new Error("Expressão inválida. Use apenas números e operadores aritméticos.");
    }
    const value = evaluateExpression(expression.replaceAll(",", "."));
    if (!Number.isFinite(value)) throw new Error("Resultado inválido.");
    return { expression, result: value };
  }
}

function evaluateExpression(expression) {
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) || [];
  let index = 0;

  function parseExpression() {
    let value = parseTerm();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      const next = parseTerm();
      value = operator === "+" ? value + next : value - next;
    }
    return value;
  }

  function parseTerm() {
    let value = parseFactor();
    while (["*", "/", "%"].includes(tokens[index])) {
      const operator = tokens[index++];
      const next = parseFactor();
      if (operator === "*") value *= next;
      if (operator === "/") value /= next;
      if (operator === "%") value %= next;
    }
    return value;
  }

  function parseFactor() {
    const token = tokens[index++];
    if (token === "-") return -parseFactor();
    if (token === "(") {
      const value = parseExpression();
      if (tokens[index++] !== ")") throw new Error("Parênteses inválidos.");
      return value;
    }
    const number = Number(token);
    if (!Number.isFinite(number)) throw new Error("Número inválido.");
    return number;
  }

  const result = parseExpression();
  if (index !== tokens.length) throw new Error("Expressão inválida.");
  return result;
}
