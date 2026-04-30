import { DateTimeTool } from "./tools/DateTimeTool.js";
import { CalculatorTool } from "./tools/CalculatorTool.js";
import { LocalStorageTool } from "./tools/LocalStorageTool.js";
import { ClipboardTool } from "./tools/ClipboardTool.js";
import { GeolocationTool } from "./tools/GeolocationTool.js";
import { NotificationTool } from "./tools/NotificationTool.js";
import { BrowserInfoTool } from "./tools/BrowserInfoTool.js";

export function registerBrowserTools(toolsService, repository) {
  toolsService.register(new DateTimeTool());
  toolsService.register(new CalculatorTool());
  toolsService.register(new BrowserInfoTool());
  toolsService.register(new ClipboardTool());
  toolsService.register(new GeolocationTool());
  toolsService.register(new NotificationTool());
  toolsService.register(new LocalStorageTool(repository));
}
