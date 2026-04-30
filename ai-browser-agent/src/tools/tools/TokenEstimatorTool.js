import { TokenEstimator } from "../../utils/TokenEstimator.js";
import { limitString } from "./ToolSafety.js";

export class TokenEstimatorTool {
  constructor() {
    this.name = "token_estimator";
    this.description = "Estima tokens de um texto usando o estimador local simples.";
    this.parameters = { text: "string" };
    this.sensitive = false;
    this.estimator = new TokenEstimator();
  }

  async execute(args = {}) {
    const text = limitString(args.text, 250000, "text");
    return {
      estimatedTokens: this.estimator.estimateText(text),
      characters: text.length,
      words: text.trim().split(/\s+/).filter(Boolean).length
    };
  }
}
