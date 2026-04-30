export class TokenEstimator {
  estimateText(text) {
    if (!text) return 0;
    const chars = String(text).length;
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    return Math.ceil(Math.max(chars / 4, words * 1.3));
  }

  estimateMessages(messages) {
    return messages.reduce((total, message) => total + this.estimateText(`${message.role}: ${message.content}`), 0);
  }

  truncateText(text, maxTokens) {
    const value = String(text || "");
    const maxChars = Math.max(80, Math.floor(maxTokens * 4));
    return value.length > maxChars ? `${value.slice(0, maxChars - 1)}...` : value;
  }
}
