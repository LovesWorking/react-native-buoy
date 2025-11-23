/**
 * HintsContext - Context for controlling hint/tooltip visibility across all dev tools
 *
 * This context allows users to disable all onboarding hints with a single prop.
 */

import { createContext, useContext, ReactNode } from "react";

interface HintsContextValue {
  /** Whether hints are disabled globally */
  hintsDisabled: boolean;
}

const HintsContext = createContext<HintsContextValue>({
  hintsDisabled: false,
});

interface HintsProviderProps {
  /** Set to true to disable all onboarding hints */
  disableHints?: boolean;
  children: ReactNode;
}

/**
 * Provider component for controlling hint visibility
 */
export function HintsProvider({ disableHints = false, children }: HintsProviderProps) {
  return (
    <HintsContext.Provider value={{ hintsDisabled: disableHints }}>
      {children}
    </HintsContext.Provider>
  );
}

/**
 * Hook to check if hints are disabled
 * @returns true if hints should be hidden
 */
export function useHintsDisabled(): boolean {
  const context = useContext(HintsContext);
  return context.hintsDisabled;
}

/**
 * Hook to get the full hints context
 */
export function useHintsContext(): HintsContextValue {
  return useContext(HintsContext);
}
