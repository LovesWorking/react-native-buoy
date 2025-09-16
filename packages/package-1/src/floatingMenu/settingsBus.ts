import type { DevToolsSettings } from './DevToolsSettingsModal';

type Listener<T> = (payload: T) => void;

class SimpleEventBus<T = DevToolsSettings> {
  private listeners: Set<Listener<T>> = new Set();

  emit(payload: T) {
    this.listeners.forEach((l) => {
      try {
        l(payload);
      } catch (e) {
        console.error("Error emitting event:", e);
      }
    });
  }

  addListener(listener: Listener<T>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const settingsBus = new SimpleEventBus<DevToolsSettings>();
