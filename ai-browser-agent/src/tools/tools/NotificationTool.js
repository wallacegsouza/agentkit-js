export class NotificationTool {
  constructor() {
    this.name = "notification";
    this.description = "Mostra uma notificação local do browser.";
    this.parameters = { title: "string", body: "string" };
    this.sensitive = true;
  }

  async execute(args) {
    if (!("Notification" in window)) throw new Error("Notifications API indisponível.");
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Permissão de notificação negada.");
    const notification = new Notification(String(args.title || "AI Browser Agent"), { body: String(args.body || "") });
    return { shown: true, title: notification.title };
  }
}
