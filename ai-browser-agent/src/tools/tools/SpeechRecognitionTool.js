export class SpeechRecognitionTool {
  constructor() {
    this.name = "speech_recognition";
    this.description = "Captura ditado por voz quando a Web Speech API está disponível.";
    this.parameters = { lang: "string opcional" };
    this.sensitive = true;
  }

  async execute(args = {}) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) throw new Error("Speech Recognition API indisponível neste browser.");
    const recognition = new Recognition();
    recognition.lang = args.lang || navigator.language || "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    return new Promise((resolve, reject) => {
      recognition.onerror = (event) => reject(new Error(event.error || "Erro de reconhecimento de voz."));
      recognition.onresult = (event) => resolve({
        transcript: event.results[0][0].transcript,
        confidence: event.results[0][0].confidence,
        lang: recognition.lang
      });
      recognition.start();
    });
  }
}
