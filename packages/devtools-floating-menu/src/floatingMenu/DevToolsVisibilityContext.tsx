/**
 * DevToolsVisibilityContext
 * 
 * Tracks when DevTools UI is visible (dial menu, modals, etc.)
 * Used by other tools (like debug borders) to hide when DevTools are active
 */

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';

interface DevToolsVisibilityContextValue {
  /** True when dial menu is open */
  isDialOpen: boolean;
  /** True when any DevTools modal/tool is open */
  isToolOpen: boolean;
  /** True when either dial or any tool is open */
  isDevToolsActive: boolean;
  /** Set dial open state */
  setDialOpen: (open: boolean) => void;
  /** Set tool open state */
  setToolOpen: (open: boolean) => void;
}

const DevToolsVisibilityContext = createContext<DevToolsVisibilityContextValue | null>(null);

export function DevToolsVisibilityProvider({ children }: { children: ReactNode }) {
  const [isDialOpen, setDialOpen] = useState(false);
  const [isToolOpen, setToolOpen] = useState(false);

  const isDevToolsActive = useMemo(
    () => isDialOpen || isToolOpen,
    [isDialOpen, isToolOpen]
  );

  // Debug logging
  useEffect(() => {
    console.log('[DevToolsVisibility] State changed:', {
      isDialOpen,
      isToolOpen,
      isDevToolsActive,
    });
  }, [isDialOpen, isToolOpen, isDevToolsActive]);

  const value = useMemo(
    () => ({
      isDialOpen,
      isToolOpen,
      isDevToolsActive,
      setDialOpen,
      setToolOpen,
    }),
    [isDialOpen, isToolOpen, isDevToolsActive]
  );

  return (
    <DevToolsVisibilityContext.Provider value={value}>
      {children}
    </DevToolsVisibilityContext.Provider>
  );
}

export function useDevToolsVisibility() {
  const context = useContext(DevToolsVisibilityContext);
  if (!context) {
    // Return safe defaults if not within provider
    return {
      isDialOpen: false,
      isToolOpen: false,
      isDevToolsActive: false,
      setDialOpen: () => {},
      setToolOpen: () => {},
    };
  }
  return context;
}

