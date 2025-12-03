import React, { createContext, useContext, ReactNode } from 'react';
import type { DefaultFloatingConfig, DefaultDialConfig } from './defaultConfig';

/**
 * Context value for default configuration settings.
 */
export interface DefaultConfigContextValue {
  /** Default tools to enable in the floating bubble when no user settings exist. */
  defaultFloatingTools?: DefaultFloatingConfig;
  /** Default tools to enable in the dial menu when no user settings exist (max 6). */
  defaultDialTools?: DefaultDialConfig;
}

const DefaultConfigContext = createContext<DefaultConfigContextValue>({});

/**
 * Provider for default configuration that can be consumed by the settings system.
 * This allows teams to set default tool configurations without prop drilling.
 *
 * @internal Used by FloatingDevTools to provide defaults to the settings hook.
 */
export function DefaultConfigProvider({
  children,
  defaultFloatingTools,
  defaultDialTools,
}: DefaultConfigContextValue & { children: ReactNode }) {
  const value = React.useMemo(
    () => ({
      defaultFloatingTools,
      defaultDialTools,
    }),
    [defaultFloatingTools, defaultDialTools]
  );

  return (
    <DefaultConfigContext.Provider value={value}>
      {children}
    </DefaultConfigContext.Provider>
  );
}

/**
 * Hook to access the default configuration from context.
 *
 * @internal Used by useDevToolsSettings to apply defaults.
 */
export function useDefaultConfig(): DefaultConfigContextValue {
  return useContext(DefaultConfigContext);
}
