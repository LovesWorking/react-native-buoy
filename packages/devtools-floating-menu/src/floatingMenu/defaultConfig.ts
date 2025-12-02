/**
 * Type-safe default configuration for React Buoy DevTools.
 *
 * This module provides a simple, type-safe way for teams to configure
 * which tools are enabled by default in the floating menu and dial menu.
 *
 * @example
 * ```tsx
 * import { FloatingDevTools } from '@react-buoy/core';
 *
 * // Simple: Enable specific tools by default
 * <FloatingDevTools
 *   defaultFloatingTools={['env', 'environment', 'network']}
 *   defaultDialTools={['env', 'network', 'storage', 'query']}
 * />
 * ```
 */

/**
 * All known tool IDs that can appear in the floating menu or dial menu.
 * This is a union type of all auto-discovered tool IDs.
 */
export type BuiltInToolId =
  | 'env'                      // Environment variables tool (@react-buoy/env)
  | 'network'                  // Network request logger (@react-buoy/network)
  | 'storage'                  // AsyncStorage/MMKV browser (@react-buoy/storage)
  | 'query'                    // React Query devtools (@react-buoy/react-query)
  | 'query-wifi-toggle'        // WiFi toggle for React Query (@react-buoy/react-query)
  | 'route-events'             // Navigation tracking (@react-buoy/route-events)
  | 'debug-borders'            // Visual debug borders (@react-buoy/debug-borders)
  | 'highlight-updates'        // Highlight re-renders toggle (@react-buoy/highlight-updates)
  | 'highlight-updates-modal'  // Render count analysis modal (@react-buoy/highlight-updates)
  | 'benchmark';               // Performance benchmarking (@react-buoy/benchmark)

/**
 * Special floating-only tool IDs that only appear in the floating bubble row.
 */
export type FloatingOnlyToolId = 'environment'; // Environment badge indicator

/**
 * All tool IDs that can appear in the floating menu (bubble row).
 * Includes all built-in tools plus floating-only tools.
 */
export type FloatingToolId = BuiltInToolId | FloatingOnlyToolId;

/**
 * Tool IDs that can appear in the dial menu.
 * Same as BuiltInToolId (environment badge is floating-only).
 */
export type DialToolId = BuiltInToolId;

/**
 * Maximum number of tools allowed in the dial menu.
 */
export const MAX_DIAL_TOOLS = 6;

/**
 * Configuration for default floating menu tools.
 * Pass an array of tool IDs to enable by default.
 *
 * @example
 * ```tsx
 * const floatingDefaults: DefaultFloatingConfig = ['env', 'environment', 'network'];
 * ```
 */
export type DefaultFloatingConfig = FloatingToolId[];

/**
 * Configuration for default dial menu tools.
 * Pass an array of 1-6 tool IDs to enable by default.
 *
 * @example
 * ```tsx
 * const dialDefaults: DefaultDialConfig = ['env', 'network', 'storage', 'query'];
 * ```
 */
export type DefaultDialConfig = DialToolId[];

/**
 * Validates that a dial configuration doesn't exceed the maximum allowed tools.
 * Throws an error with helpful message if validation fails.
 *
 * @param tools - Array of dial tool IDs to validate
 * @throws Error if more than MAX_DIAL_TOOLS are provided
 *
 * @example
 * ```tsx
 * // This is valid
 * validateDialConfig(['env', 'network', 'storage']);
 *
 * // This throws an error
 * validateDialConfig(['env', 'network', 'storage', 'query', 'route-events', 'debug-borders', 'benchmark']);
 * // Error: "Dial menu default configuration has 7 tools, but maximum is 6..."
 * ```
 */
export function validateDialConfig(tools: DefaultDialConfig): void {
  if (tools.length > MAX_DIAL_TOOLS) {
    const toolList = tools.map((t) => `"${t}"`).join(', ');
    throw new Error(
      `Dial menu default configuration has ${tools.length} tools, but maximum is ${MAX_DIAL_TOOLS}. ` +
      `Tools provided: [${toolList}]. ` +
      `Please remove ${tools.length - MAX_DIAL_TOOLS} tool(s) from defaultDialTools.`
    );
  }
}

/**
 * Helper to create a type-safe default configuration.
 * Provides autocomplete and validation at compile time.
 *
 * @example
 * ```tsx
 * import { createDefaultConfig } from '@react-buoy/core';
 *
 * const config = createDefaultConfig({
 *   floating: ['env', 'environment', 'network', 'query-wifi-toggle'],
 *   dial: ['env', 'network', 'storage', 'query', 'route-events', 'debug-borders'],
 * });
 *
 * <FloatingDevTools
 *   defaultFloatingTools={config.floating}
 *   defaultDialTools={config.dial}
 * />
 * ```
 */
export function createDefaultConfig<
  F extends FloatingToolId[],
  D extends DialToolId[]
>(config: {
  floating?: F;
  dial?: D;
}): {
  floating: F | undefined;
  dial: D | undefined;
} {
  // Runtime validation for dial tools
  if (config.dial) {
    validateDialConfig(config.dial);
  }

  return {
    floating: config.floating,
    dial: config.dial,
  };
}

/**
 * Type guard to check if a string is a valid FloatingToolId.
 */
export function isFloatingToolId(id: string): id is FloatingToolId {
  const validIds: FloatingToolId[] = [
    'env',
    'network',
    'storage',
    'query',
    'query-wifi-toggle',
    'route-events',
    'debug-borders',
    'highlight-updates',
    'highlight-updates-modal',
    'benchmark',
    'environment',
  ];
  return validIds.includes(id as FloatingToolId);
}

/**
 * Type guard to check if a string is a valid DialToolId.
 */
export function isDialToolId(id: string): id is DialToolId {
  const validIds: DialToolId[] = [
    'env',
    'network',
    'storage',
    'query',
    'query-wifi-toggle',
    'route-events',
    'debug-borders',
    'highlight-updates',
    'highlight-updates-modal',
    'benchmark',
  ];
  return validIds.includes(id as DialToolId);
}

/**
 * Converts an array of tool IDs into a settings record.
 * Used internally to convert default config to DevToolsSettings format.
 *
 * @internal
 */
export function toolIdsToRecord<T extends string>(
  ids: T[],
  allPossibleIds: T[]
): Record<string, boolean> {
  const record: Record<string, boolean> = {};
  const enabledSet = new Set(ids);

  for (const id of allPossibleIds) {
    record[id] = enabledSet.has(id);
  }

  return record;
}
