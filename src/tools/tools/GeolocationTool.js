export class GeolocationTool {
  constructor() {
    this.name = "geolocation";
    this.description = "Solicita localização aproximada do usuário via browser.";
    this.parameters = {};
    this.sensitive = true;
  }

  async execute() {
    if (!navigator.geolocation) throw new Error("Geolocation API indisponível.");
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }),
        (error) => reject(new Error(error.message)),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }
}
