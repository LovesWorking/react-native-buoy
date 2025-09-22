import { settingsBus } from './settingsBus';
import type { DevToolsSettings } from './DevToolsSettingsModal';

export class SettingsAPI {
  static emit(settings: DevToolsSettings) {
    settingsBus.emit(settings);
  }

  static addListener(listener: (settings: DevToolsSettings) => void) {
    return settingsBus.addListener(listener);
  }
}