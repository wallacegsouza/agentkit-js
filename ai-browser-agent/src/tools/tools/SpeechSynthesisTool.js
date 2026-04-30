import { limitString } from "./ToolSafety.js";

export class SpeechSynthesisTool {
  constructor() {
    this.name = "speech_synthesis";
    this.description = "Lê texto em voz alta usando Web Speech API e permite parar leituras anteriores.";
    this.parameters = { text: "string", lang: "string opcional", stop: "boolean opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    if (!("speechSynthesis" in window)) throw new Error("Speech Synthesis API indisponível.");
    if (args.stop) {
      speechSynthesis.cancel();
      return { stopped: true };
    }
    const text = limitString(args.text, 5000, "text");
    const utterance = new SpeechSynthesisUtterance(text);
    if (args.lang) utterance.lang = String(args.lang);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    return { speaking: true, characters: text.length, lang: utterance.lang || null };
  }
}
