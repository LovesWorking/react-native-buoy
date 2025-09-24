import React from "react";
import { AppHostProvider } from "./AppHost";
import { FloatingMenu, type FloatingMenuProps } from "./FloatingMenu";
import { AppOverlay } from "./AppHost";

/**
 * Unified floating development tools component.
 *
 * This component combines AppHostProvider, FloatingMenu, and AppOverlay
 * into a single component for simplified setup and better developer experience.
 *
 * For advanced use cases requiring custom provider nesting or configuration,
 * the individual components (AppHostProvider, FloatingMenu, AppOverlay)
 * are still available for import.
 *
 * @param props - FloatingMenu props (apps, state, actions, hidden, environment, userRole)
 */
export const FloatingDevTools = (props: FloatingMenuProps) => (
  <AppHostProvider>
    <FloatingMenu {...props} />
    <AppOverlay />
  </AppHostProvider>
);