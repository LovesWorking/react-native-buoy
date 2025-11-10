import { createMMKV } from "react-native-mmkv";

// ============================================================================
// MMKV Instances - Testing All Configuration Options
// ============================================================================

/**
 * DEFAULT INSTANCE
 * Tests: Basic operations, default configuration
 */
export const storage = createMMKV({
  id: "mmkv.default",
});

/**
 * ENCRYPTED INSTANCE
 * Tests: AES encryption, secure storage
 */
export const encryptedStorage = createMMKV({
  id: "encrypted-storage",
  encryptionKey: "test-encryption", // 16 bytes max
});

/**
 * USER PREFERENCES INSTANCE
 * Tests: Namespaced storage for settings
 */
export const userPrefsStorage = createMMKV({
  id: "user-preferences",
});

/**
 * CACHE INSTANCE
 * Tests: Temporary data storage
 */
export const cacheStorage = createMMKV({
  id: "cache",
});

/**
 * MULTI-PROCESS INSTANCE
 * Tests: Multi-process mode for shared data
 */
export const sharedStorage = createMMKV({
  id: "shared-storage",
  mode: "multi-process",
});

// ============================================================================
// Register with DevTools (Required for react-native-mmkv v4)
// ============================================================================

// ⚠️ IMPORTANT: Manual registration is REQUIRED for MMKV v4
// Auto-detection is not possible due to Metro bundler + ES6 module limitations
// See: packages/storage/src/storage/utils/mmkvAutoDetection.ts for details

try {
  const { registerMMKVInstance } = require("@react-buoy/storage");

  // Register all instances with metadata
  registerMMKVInstance("mmkv.default", storage);
  registerMMKVInstance("encrypted-storage", encryptedStorage, {
    encrypted: true,
  });
  registerMMKVInstance("user-preferences", userPrefsStorage);
  registerMMKVInstance("cache", cacheStorage);
  registerMMKVInstance("shared-storage", sharedStorage, {
    mode: "multi-process",
  });

} catch (error) {
  // Storage package not installed - that's fine
}

// ============================================================================
// Mock Data Initialization
// ============================================================================

/**
 * Initialize MMKV with comprehensive mock data covering:
 * - All primitive types (string, number, boolean, ArrayBuffer)
 * - Complex objects (JSON serialized)
 * - Edge cases (empty, null, undefined, large values)
 * - Multiple instances with different configurations
 * - Real-world use cases
 */
export function initializeMockMMKVData() {
  // ============================================================================
  // DEFAULT STORAGE - All Data Types & Use Cases
  // ============================================================================

  // ---- STRING VALUES ----
  storage.set("string.simple", "Hello World");
  storage.set("string.empty", "");
  storage.set("string.unicode", "Hello 👋 世界 🌍");
  storage.set("string.multiline", "Line 1\nLine 2\nLine 3");
  storage.set("string.long", "A".repeat(10000)); // 10KB string
  storage.set("string.json", '{"test": "value", "nested": {"key": 123}}');
  storage.set("string.timestamp", new Date().toISOString());
  storage.set("string.url", "https://example.com/path?query=value&foo=bar");

  // ---- NUMBER VALUES ----
  storage.set("number.zero", 0);
  storage.set("number.positive", 42);
  storage.set("number.negative", -273.15);
  storage.set("number.float", 3.14159265359);
  storage.set("number.large", Number.MAX_SAFE_INTEGER); // 9007199254740991
  storage.set("number.small", Number.MIN_SAFE_INTEGER); // -9007199254740991
  storage.set("number.timestamp", Date.now());
  storage.set("number.percentage", 0.875);

  // ---- BOOLEAN VALUES ----
  storage.set("boolean.true", true);
  storage.set("boolean.false", false);

  // ---- COMPLEX OBJECTS (JSON Serialized) ----
  storage.set(
    "object.user",
    JSON.stringify({
      id: "user123",
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      createdAt: new Date().toISOString(),
      preferences: {
        theme: "dark",
        notifications: true,
      },
    })
  );

  storage.set(
    "object.array",
    JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  );

  storage.set(
    "object.nested",
    JSON.stringify({
      level1: {
        level2: {
          level3: {
            level4: {
              value: "deeply nested",
            },
          },
        },
      },
    })
  );

  storage.set(
    "object.mixed",
    JSON.stringify({
      string: "text",
      number: 123,
      boolean: true,
      null: null,
      array: [1, "two", false],
      object: { nested: "value" },
    })
  );

  // ---- APP SETTINGS ----
  storage.set("@app/settings:theme", "dark");
  storage.set("@app/settings:notifications", true);
  storage.set("@app/settings:language", "en");
  storage.set("@app/settings:fontSize", 16);
  storage.set("@app/settings:autoSave", false);

  // ---- APP STATE ----
  storage.set("@app/isFirstLaunch", false);
  storage.set("@app/appVersion", "1.0.15");
  storage.set("@app/lastLoginDate", new Date().toISOString());
  storage.set("@app/launchCount", 42);
  storage.set("@app/lastSyncTimestamp", Date.now());

  // ---- FEATURE FLAGS ----
  storage.set("@features/darkMode", true);
  storage.set("@features/newUI", false);
  storage.set("@features/betaFeatures", true);
  storage.set("@features/analytics", false);

  // ============================================================================
  // ENCRYPTED STORAGE - Sensitive Data
  // ============================================================================

  // ---- AUTHENTICATION ----
  encryptedStorage.set("auth.token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  encryptedStorage.set("auth.refreshToken", "refresh_token_xyz789");
  encryptedStorage.set("auth.expiresAt", Date.now() + 3600000);
  encryptedStorage.set("auth.isAuthenticated", true);

  // ---- CREDENTIALS ----
  encryptedStorage.set("credentials.apiKey", "sk-test-1234567890abcdef");
  encryptedStorage.set("credentials.secret", "super_secret_value_xyz");

  // ---- PERSONAL DATA ----
  encryptedStorage.set(
    "user.sensitive",
    JSON.stringify({
      ssn: "123-45-6789",
      dob: "1990-01-01",
      phone: "+1-555-0100",
    })
  );

  // ---- PAYMENT INFO ----
  encryptedStorage.set(
    "payment.card",
    JSON.stringify({
      last4: "4242",
      brand: "visa",
      expMonth: 12,
      expYear: 2025,
    })
  );

  // ============================================================================
  // USER PREFERENCES STORAGE
  // ============================================================================

  // ---- THEME SETTINGS ----
  userPrefsStorage.set("theme", "dark");
  userPrefsStorage.set("accentColor", "#007AFF");
  userPrefsStorage.set("fontSize", 16);
  userPrefsStorage.set("fontFamily", "System");

  // ---- NOTIFICATIONS ----
  userPrefsStorage.set("soundEnabled", true);
  userPrefsStorage.set("vibrationEnabled", false);
  userPrefsStorage.set("badgeCount", 3);
  userPrefsStorage.set("notificationTime", "09:00");

  // ---- PRIVACY ----
  userPrefsStorage.set("analyticsEnabled", false);
  userPrefsStorage.set("crashReportsEnabled", true);
  userPrefsStorage.set("locationAccess", true);

  // ---- PERSONALIZATION ----
  userPrefsStorage.set(
    "favorites",
    JSON.stringify(["item1", "item2", "item3", "item4", "item5"])
  );
  userPrefsStorage.set("recentSearches", JSON.stringify(["query1", "query2"]));
  userPrefsStorage.set("lastViewedScreen", "Home");

  // ============================================================================
  // CACHE STORAGE - API Responses & Temporary Data
  // ============================================================================

  // ---- API CACHE ----
  cacheStorage.set(
    "api/posts",
    JSON.stringify([
      { id: 1, title: "First Post", body: "Hello World", likes: 42 },
      { id: 2, title: "Second Post", body: "MMKV is fast!", likes: 128 },
      {
        id: 3,
        title: "Third Post",
        body: "DevTools testing",
        likes: 256,
      },
    ])
  );

  cacheStorage.set(
    "api/users",
    JSON.stringify([
      { id: 1, name: "Alice", role: "admin", active: true },
      { id: 2, name: "Bob", role: "user", active: true },
      { id: 3, name: "Charlie", role: "moderator", active: false },
    ])
  );

  cacheStorage.set(
    "api/comments",
    JSON.stringify([
      { id: 1, postId: 1, text: "Great post!", author: "Alice" },
      { id: 2, postId: 1, text: "Thanks for sharing", author: "Bob" },
    ])
  );

  // ---- CACHE METADATA ----
  cacheStorage.set("lastFetchTimestamp", Date.now());
  cacheStorage.set("cacheVersion", "1.0");
  cacheStorage.set("cacheHitCount", 1024);
  cacheStorage.set("cacheMissCount", 42);

  // ---- TEMPORARY DATA ----
  cacheStorage.set("temp.uploadProgress", 0.75);
  cacheStorage.set("temp.downloadQueue", JSON.stringify([1, 2, 3]));
  cacheStorage.set("temp.retryCount", 3);

  // ============================================================================
  // SHARED STORAGE - Multi-process Data
  // ============================================================================

  // ---- SHARED STATE ----
  sharedStorage.set("shared.counter", 0);
  sharedStorage.set("shared.isLocked", false);
  sharedStorage.set("shared.lastUpdate", Date.now());

  // ---- SYNC DATA ----
  sharedStorage.set("sync.status", "completed");
  sharedStorage.set("sync.lastSync", new Date().toISOString());
  sharedStorage.set("sync.pendingItems", 0);
}
