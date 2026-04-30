import { Agent } from "./agent/Agent.js";
import { ContextBuilder } from "./agent/ContextBuilder.js";
import { LLMService } from "./llm/LLMService.js";
import { RuntimeSecrets } from "./llm/RuntimeSecrets.js";
import { MemoryOptimizerAgent } from "./memory/MemoryOptimizerAgent.js";
import { MemoryService } from "./memory/MemoryService.js";
import { ShortTermMemory } from "./memory/ShortTermMemory.js";
import { LongTermMemory } from "./memory/LongTermMemory.js";
import { LocalStorageRepository } from "./storage/LocalStorageRepository.js";
import { SettingsStore } from "./storage/SettingsStore.js";
import { registerBrowserTools } from "./tools/BrowserToolsRegistry.js";
import { ToolsService } from "./tools/ToolsService.js";
import { EventBus } from "./utils/EventBus.js";
import { Logger } from "./utils/Logger.js";
import { ChatUI } from "./ui/ChatUI.js";
import { SettingsUI } from "./ui/SettingsUI.js";
import { MemoryUI } from "./ui/MemoryUI.js";
import { HelpUI } from "./ui/HelpUI.js";
import { DebugUI } from "./ui/DebugUI.js";
import { Toast } from "./ui/Toast.js";

const repository = new LocalStorageRepository();
const settingsStore = new SettingsStore({ repository });
const eventBus = new EventBus();
const logger = new Logger({ repository, eventBus });
logger.configure(settingsStore.get());

const runtimeSecrets = new RuntimeSecrets();
const toast = new Toast();
const shortTermMemory = new ShortTermMemory({
  repository,
  maxMessages: settingsStore.get().maxShortTermMessages
});
const longTermMemory = new LongTermMemory({ repository });
const memoryService = new MemoryService({ shortTermMemory, longTermMemory, eventBus, logger });

const toolsService = new ToolsService({
  logger,
  confirmationProvider: (message) => Promise.resolve(window.confirm(message))
});
registerBrowserTools(toolsService, repository);
toolsService.setEnabled(settingsStore.get().toolsEnabled);

const llmService = new LLMService({ logger });
const contextBuilder = new ContextBuilder({ memoryService, toolsService });
const memoryOptimizer = new MemoryOptimizerAgent({
  memoryService,
  llmService,
  runtimeSecrets,
  settingsProvider: () => settingsStore.get(),
  logger
});
const agent = new Agent({
  llmService,
  contextBuilder,
  memoryService,
  memoryOptimizer,
  runtimeSecrets,
  settingsProvider: () => settingsStore.get(),
  logger
});

eventBus.on("settings:changed", (settings) => {
  logger.configure(settings);
  shortTermMemory.setMaxMessages(settings.maxShortTermMessages);
  toolsService.setEnabled(settings.toolsEnabled);
});

const settingsUI = new SettingsUI({ settingsStore, runtimeSecrets, eventBus, toast });
const memoryUI = new MemoryUI({ memoryService, settingsStore, toast, eventBus });
const helpUI = new HelpUI();
const debugUI = new DebugUI({ logger, eventBus });

const chatUI = new ChatUI({
  root: document.querySelector("#app"),
  agent,
  memoryService,
  settingsUI,
  memoryUI,
  helpUI,
  debugUI,
  settingsStore,
  eventBus,
  toast
});

chatUI.mount();
logger.info("Aplicação iniciada");
