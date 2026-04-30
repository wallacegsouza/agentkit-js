export class Toast {
  constructor() {
    this.root = document.createElement("div");
    this.root.className = "fixed bottom-4 right-4 z-[60] flex max-w-sm flex-col gap-2";
    document.body.append(this.root);
  }

  show(message, type = "info") {
    const colors = {
      info: "border-sky-200 bg-sky-50 text-sky-950",
      success: "border-emerald-200 bg-emerald-50 text-emerald-950",
      warn: "border-amber-200 bg-amber-50 text-amber-950",
      error: "border-rose-200 bg-rose-50 text-rose-950"
    };
    const item = document.createElement("div");
    item.className = `rounded-md border px-3 py-2 text-sm shadow ${colors[type] || colors.info}`;
    item.textContent = message;
    this.root.append(item);
    window.setTimeout(() => item.remove(), 4200);
  }
}
