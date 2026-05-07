export class PageInfoTool {
  constructor() {
    this.name = "page_info";
    this.description = "Retorna URL atual, título da página e dimensões da viewport sem ler o conteúdo da página.";
    this.parameters = {};
    this.sensitive = false;
  }

  async execute() {
    return {
      title: document.title,
      url: window.location.href,
      origin: window.location.origin,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
}
