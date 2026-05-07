export class Modal {
  constructor({ title, content, width = "max-w-3xl" }) {
    this.title = title;
    this.content = content;
    this.width = width;
    this.element = null;
  }

  open() {
    this.close();
    const wrapper = document.createElement("div");
    wrapper.className = "fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-3 modal-backdrop";
    wrapper.innerHTML = `
      <section class="w-full ${this.width} max-h-[92vh] overflow-hidden rounded-lg bg-white shadow-xl border border-zinc-200">
        <header class="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 class="text-base font-semibold">${this.title}</h2>
          <button data-close class="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100" aria-label="Fechar">x</button>
        </header>
        <div class="max-h-[80vh] overflow-auto p-4 scrollbar-thin"></div>
      </section>
    `;
    wrapper.querySelector("div").append(this.content);
    wrapper.querySelector("[data-close]").addEventListener("click", () => this.close());
    wrapper.addEventListener("click", (event) => {
      if (event.target === wrapper) this.close();
    });
    document.body.append(wrapper);
    this.element = wrapper;
  }

  close() {
    this.element?.remove();
    this.element = null;
  }
}
