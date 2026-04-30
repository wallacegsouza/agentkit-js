export class CameraCheckTool {
  constructor() {
    this.name = "camera_check";
    this.description = "Verifica disponibilidade de câmera sem capturar imagem por padrão.";
    this.parameters = {};
    this.sensitive = true;
  }

  async execute() {
    if (!navigator.mediaDevices?.enumerateDevices) throw new Error("MediaDevices API indisponível.");
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput").map((device) => ({
      label: device.label || "Câmera sem permissão de nome",
      deviceIdKnown: Boolean(device.deviceId),
      groupIdKnown: Boolean(device.groupId)
    }));
    return { available: cameras.length > 0, count: cameras.length, cameras };
  }
}
