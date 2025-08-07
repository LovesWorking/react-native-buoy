// AsyncStorage will be loaded lazily
let AsyncStorageModule: any = null;
let asyncStorageLoadPromise: Promise<void> | null = null;

const loadAsyncStorage = async () => {
  if (asyncStorageLoadPromise) return asyncStorageLoadPromise;

  asyncStorageLoadPromise = (async () => {
    try {
      const module = await import("@react-native-async-storage/async-storage");
      AsyncStorageModule = module.default;
      console.log('[AsyncStorageListener] AsyncStorage module loaded successfully');
    } catch (error) {
      console.warn('[AsyncStorageListener] AsyncStorage not found. Listener disabled.', error);
    }
  })();

  return asyncStorageLoadPromise;
};

// Event types for AsyncStorage operations
export interface AsyncStorageEvent {
  action: 'setItem' | 'removeItem' | 'mergeItem' | 'clear' | 'multiSet' | 'multiRemove' | 'multiMerge';
  timestamp: Date;
  data?: {
    key?: string;
    value?: string;
    keys?: string[];
    pairs?: Array<[string, string]>;
  };
}

export type AsyncStorageEventListener = (event: AsyncStorageEvent) => void;

class AsyncStorageListener {
  private listeners: AsyncStorageEventListener[] = [];
  private isListening = false;
  
  // Store original methods
  private originalSetItem: any;
  private originalRemoveItem: any;
  private originalMergeItem: any;
  private originalClear: any;
  private originalMultiSet: any;
  private originalMultiRemove: any;
  private originalMultiMerge: any;

  constructor() {
    console.log('[AsyncStorageListener] Initializing listener singleton');
  }

  // Initialize and store original methods
  private async initialize() {
    await loadAsyncStorage();
    
    if (!AsyncStorageModule) {
      console.error('[AsyncStorageListener] AsyncStorage module not available');
      return false;
    }

    // Store original methods
    this.originalSetItem = AsyncStorageModule.setItem.bind(AsyncStorageModule);
    this.originalRemoveItem = AsyncStorageModule.removeItem.bind(AsyncStorageModule);
    this.originalMergeItem = AsyncStorageModule.mergeItem.bind(AsyncStorageModule);
    this.originalClear = AsyncStorageModule.clear.bind(AsyncStorageModule);
    this.originalMultiSet = AsyncStorageModule.multiSet.bind(AsyncStorageModule);
    this.originalMultiRemove = AsyncStorageModule.multiRemove.bind(AsyncStorageModule);
    this.originalMultiMerge = AsyncStorageModule.multiMerge ? AsyncStorageModule.multiMerge.bind(AsyncStorageModule) : null;
    
    console.log('[AsyncStorageListener] Original methods stored successfully');
    return true;
  }

  // Emit event to all listeners
  private emit(event: AsyncStorageEvent) {
    console.log(`[AsyncStorageListener] Emitting event: ${event.action}`, {
      timestamp: event.timestamp.toISOString(),
      data: event.data,
      listenerCount: this.listeners.length
    });
    
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('[AsyncStorageListener] Error in event listener:', error);
      }
    });
  }

  // Start listening to AsyncStorage operations
  async startListening() {
    if (this.isListening) {
      console.warn('[AsyncStorageListener] Already listening');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      console.error('[AsyncStorageListener] Failed to initialize - AsyncStorage not available');
      return;
    }

    console.log('[AsyncStorageListener] Starting to listen for AsyncStorage operations');

    // Swizzle setItem
    AsyncStorageModule.setItem = async (key: string, value: string) => {
      console.log(`[AsyncStorageListener] Intercepted setItem: key="${key}", value="${value?.substring(0, 100)}..."`);
      this.emit({
        action: 'setItem',
        timestamp: new Date(),
        data: { key, value }
      });
      return this.originalSetItem(key, value);
    };

    // Swizzle removeItem
    AsyncStorageModule.removeItem = async (key: string) => {
      console.log(`[AsyncStorageListener] Intercepted removeItem: key="${key}"`);
      this.emit({
        action: 'removeItem',
        timestamp: new Date(),
        data: { key }
      });
      return this.originalRemoveItem(key);
    };

    // Swizzle mergeItem
    AsyncStorageModule.mergeItem = async (key: string, value: string) => {
      console.log(`[AsyncStorageListener] Intercepted mergeItem: key="${key}", value="${value?.substring(0, 100)}..."`);
      this.emit({
        action: 'mergeItem',
        timestamp: new Date(),
        data: { key, value }
      });
      return this.originalMergeItem(key, value);
    };

    // Swizzle clear
    AsyncStorageModule.clear = async () => {
      console.log('[AsyncStorageListener] Intercepted clear');
      this.emit({
        action: 'clear',
        timestamp: new Date()
      });
      return this.originalClear();
    };

    // Swizzle multiSet
    AsyncStorageModule.multiSet = async (keyValuePairs: readonly (readonly [string, string])[]) => {
      console.log(`[AsyncStorageListener] Intercepted multiSet: ${keyValuePairs.length} pairs`);
      this.emit({
        action: 'multiSet',
        timestamp: new Date(),
        data: { pairs: keyValuePairs as Array<[string, string]> }
      });
      return this.originalMultiSet(keyValuePairs);
    };

    // Swizzle multiRemove
    AsyncStorageModule.multiRemove = async (keys: readonly string[]) => {
      console.log(`[AsyncStorageListener] Intercepted multiRemove: ${keys.length} keys`);
      this.emit({
        action: 'multiRemove',
        timestamp: new Date(),
        data: { keys: keys as string[] }
      });
      return this.originalMultiRemove(keys);
    };

    // Swizzle multiMerge if available
    if (this.originalMultiMerge) {
      AsyncStorageModule.multiMerge = async (keyValuePairs: readonly (readonly [string, string])[]) => {
        console.log(`[AsyncStorageListener] Intercepted multiMerge: ${keyValuePairs.length} pairs`);
        this.emit({
          action: 'multiMerge',
          timestamp: new Date(),
          data: { pairs: keyValuePairs as Array<[string, string]> }
        });
        return this.originalMultiMerge(keyValuePairs);
      };
    }

    this.isListening = true;
    console.log('[AsyncStorageListener] Started listening successfully');
  }

  // Stop listening and restore original methods
  stopListening() {
    if (!this.isListening) {
      console.warn('[AsyncStorageListener] Not currently listening');
      return;
    }

    if (!AsyncStorageModule) {
      console.warn('[AsyncStorageListener] AsyncStorage module not loaded');
      return;
    }

    console.log('[AsyncStorageListener] Stopping listener and restoring original methods');

    // Restore original methods
    AsyncStorageModule.setItem = this.originalSetItem;
    AsyncStorageModule.removeItem = this.originalRemoveItem;
    AsyncStorageModule.mergeItem = this.originalMergeItem;
    AsyncStorageModule.clear = this.originalClear;
    AsyncStorageModule.multiSet = this.originalMultiSet;
    AsyncStorageModule.multiRemove = this.originalMultiRemove;
    if (this.originalMultiMerge) {
      AsyncStorageModule.multiMerge = this.originalMultiMerge;
    }

    this.isListening = false;
    console.log('[AsyncStorageListener] Stopped listening successfully');
  }

  // Add event listener
  addListener(listener: AsyncStorageEventListener) {
    console.log(`[AsyncStorageListener] Adding listener (total will be: ${this.listeners.length + 1})`);
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
        console.log(`[AsyncStorageListener] Removed listener (remaining: ${this.listeners.length})`);
      }
    };
  }

  // Remove all listeners
  removeAllListeners() {
    const count = this.listeners.length;
    this.listeners = [];
    console.log(`[AsyncStorageListener] Removed all ${count} listeners`);
  }

  // Check if currently listening
  get isActive() {
    return this.isListening;
  }

  // Get number of active listeners
  get listenerCount() {
    return this.listeners.length;
  }
}

// Create singleton instance
const asyncStorageListener = new AsyncStorageListener();

// Simple API functions
export const startListening = () => asyncStorageListener.startListening();
export const stopListening = () => asyncStorageListener.stopListening();
export const addListener = (listener: AsyncStorageEventListener) => asyncStorageListener.addListener(listener);
export const removeAllListeners = () => asyncStorageListener.removeAllListeners();
export const isListening = () => asyncStorageListener.isActive;
export const getListenerCount = () => asyncStorageListener.listenerCount;

// Export the instance for advanced usage
export default asyncStorageListener;