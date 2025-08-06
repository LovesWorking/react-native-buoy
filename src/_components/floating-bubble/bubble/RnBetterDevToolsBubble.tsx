import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSentrySubtitle, SentryLogsModal } from "../../../_sections/sentry";
import { RequiredEnvVar, useEnvVarsSubtitle, EnvVarsModal } from "../../../_sections/env";
import { StorageModal } from "../../../_sections/storage";
import { BubblePresentation } from "./components/BubblePresentation";
import type { UserRole } from "./components/UserStatus";
import type { Environment } from "../../../_sections/env";
import { ErrorBoundary } from "../../../_shared/ui/components/ErrorBoundary";
import {
  ReactQueryModal,
  useReactQueryState,
  useModalManager,
} from "../../../_sections/react-query";
import { DevToolsConsole } from "../console/DevToolsConsole";
import { useBubbleVisibilitySettings } from "./hooks/useBubbleVisibilitySettings";

// Re-export types that developers will need
export type { UserRole } from "./components/UserStatus";
export type { Environment, RequiredEnvVar } from "../../../_sections/env";

/**
 * Props for the RnBetterDevToolsBubble component
 */
interface RnBetterDevToolsBubbleProps {
  /**
   * The Tanstack Query client instance to use for data management
   * This is required for the dev tools to interact with your React Query data
   */
  queryClient: QueryClient;

  /**
   * The current user's role in the application
   * Used to display user status indicator in the bubble
   * @example "admin" | "internal" | "user"
   */
  userRole?: UserRole;

  /**
   * The current application environment
   * Used to display environment indicator in the bubble
   * @example "local" | "dev" | "qa" | "staging" | "prod"
   */
  environment?: Environment;

  /**
   * Array of required environment variables to check
   * These will be displayed in the DevTools console with their status
   * @example [{ name: "API_URL", description: "Backend API endpoint" }]
   */
  requiredEnvVars?: RequiredEnvVar[];

  /**
   * Enable shared modal dimensions across all modals
   * When true, all modals will maintain consistent size
   * @default false
   */
  enableSharedModalDimensions?: boolean;

  /**
   * Hide the environment indicator in the bubble
   * Sets the default visibility for all users
   * Users can override this in their local settings
   * @default false
   */
  hideEnvironment?: boolean;

  /**
   * Hide the user status indicator in the bubble
   * Only applies when userRole prop is provided
   * @default false
   */
  hideUserStatus?: boolean;

  /**
   * Hide the React Query button in the bubble
   * Sets the default visibility for all users
   * Users can override this in their local settings
   * @default false
   */
  hideQueryButton?: boolean;

  /**
   * Hide the WiFi toggle button in the bubble
   * Sets the default visibility for all users
   * Users can override this in their local settings
   * @default false
   */
  hideWifiToggle?: boolean;

  /**
   * Hide the Environment Variables button in the bubble
   * Sets the default visibility for all users
   * Users can override this in their local settings
   * @default true (off by default)
   */
  hideEnvButton?: boolean;

  /**
   * Hide the Sentry Events button in the bubble
   * Sets the default visibility for all users
   * Users can override this in their local settings
   * @default true (off by default)
   */
  hideSentryButton?: boolean;

  /**
   * Hide the Storage Browser button in the bubble
   * Sets the default visibility for all users
   * Users can override this in their local settings
   * @default true (off by default)
   */
  hideStorageButton?: boolean;
}

/**
 * RnBetterDevToolsBubble - A floating developer tools bubble for React Native apps
 *
 * This component provides a draggable floating bubble that gives developers quick access to:
 * - React Query dev tools for inspecting and modifying query/mutation data
 * - Environment indicator showing the current app environment
 * - User role status display
 * - WiFi toggle for testing offline scenarios
 * - Dev console with environment variable checking and other debugging tools
 *
 * ## Visibility Control Priority System:
 * 1. **User Preferences (Highest Priority)**: If a user has explicitly toggled a button 
 *    in the settings UI, that preference is always used
 * 2. **Developer Defaults (Props)**: If no user preference exists, the hide* props 
 *    determine default visibility (e.g., hide certain buttons in production)
 * 3. **Built-in Defaults**: If neither user preference nor props exist, built-in 
 *    defaults are used (most buttons visible)
 *
 * @example
 * ```tsx
 * // Production setup - hide most buttons by default
 * <RnBetterDevToolsBubble
 *   queryClient={queryClient}
 *   environment="prod"
 *   hideQueryButton={true}   // Hidden by default in prod
 *   hideWifiToggle={true}    // Hidden by default in prod
 *   hideEnvButton={true}     // Hidden by default in prod
 * />
 * // Users can still enable these buttons in their local settings
 * ```
 */
export function RnBetterDevToolsBubble({
  queryClient,
  userRole,
  environment,
  requiredEnvVars = [],
  enableSharedModalDimensions = false,
  hideEnvironment,
  hideUserStatus,
  hideQueryButton,
  hideWifiToggle,
  hideEnvButton,
  hideSentryButton,
  hideStorageButton
}: RnBetterDevToolsBubbleProps) {
  
  // Info: Show how props and user settings interact
  useEffect(() => {
    const propsProvided = [
      hideQueryButton !== undefined && `hideQueryButton=${hideQueryButton}`,
      hideEnvironment !== undefined && `hideEnvironment=${hideEnvironment}`,
      hideWifiToggle !== undefined && `hideWifiToggle=${hideWifiToggle}`,
      hideEnvButton !== undefined && `hideEnvButton=${hideEnvButton}`,
      hideSentryButton !== undefined && `hideSentryButton=${hideSentryButton}`,
      hideStorageButton !== undefined && `hideStorageButton=${hideStorageButton}`,
    ].filter(Boolean);
    
    if (propsProvided.length > 0) {
      console.info(
        '[RnBetterDevToolsBubble] Default visibility props: ' + propsProvided.join(', ') + '. ' +
        'Users can override these in settings.'
      );
    }
  }, [hideQueryButton, hideEnvironment, hideWifiToggle, hideEnvButton, hideSentryButton, hideStorageButton]);
  
  // Load visibility settings from storage
  const { settings: visibilitySettings, reload: reloadSettings } = useBubbleVisibilitySettings({
    hideEnvironment,
    hideUserStatus,
    hideQueryButton,
    hideWifiToggle,
    hideEnvButton,
    hideSentryButton,
    hideStorageButton,
  });

  // Specialized hooks for different concerns following composition principles
  const { getSentrySubtitle } = useSentrySubtitle();
  const { getRnBetterDevToolsSubtitle } = useReactQueryState(queryClient);
  const envVarsSubtitle = useEnvVarsSubtitle(requiredEnvVars);

  // State for additional modals
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [isSentryModalOpen, setIsSentryModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Modal management hook with persistence - extracted from main component logic
  const {
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    activeTab,
    selectedMutationId,
    setSelectedSection,
    setActiveFilter,
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
    handleTabChange,
    handleMutationSelect,
  } = useModalManager();

  // Handlers for new modals
  const handleEnvPress = () => setIsEnvModalOpen(true);
  const handleSentryPress = () => setIsSentryModalOpen(true);
  const handleStoragePress = () => setIsStorageModalOpen(true);

  // Hide bubble when any modal is open to prevent visual overlap
  const isAnyModalOpen = isModalOpen || isDebugModalOpen || isEnvModalOpen || isSentryModalOpen || isStorageModalOpen;

  // Note: We no longer wait for state restoration to show the bubble
  // The bubble should be visible immediately on app launch
  

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Bubble Presentation - Encapsulates all UI logic internally */}
        {/* Hidden when modals are open to prevent visual conflicts */}
        {!isAnyModalOpen && (
          <BubblePresentation
            key="bubble-presentation"
            environment={environment}
            userRole={userRole}
            onStatusPress={handleStatusPress}
            onQueryPress={handleQueryPress}
            onEnvPress={handleEnvPress}
            onSentryPress={handleSentryPress}
            onStoragePress={handleStoragePress}
            config={{
              showEnvironment: !visibilitySettings.hideEnvironment,
              showUserStatus: !hideUserStatus, // Never allow hiding user status
              showQueryButton: !visibilitySettings.hideQueryButton,
              showWifiToggle: !visibilitySettings.hideWifiToggle,
              showEnvButton: !visibilitySettings.hideEnvButton,
              showSentryButton: !visibilitySettings.hideSentryButton,
              showStorageButton: !visibilitySettings.hideStorageButton,
            }}
          />
        )}

        {/* Floating Data Editor Modal - Auto-opens if restored state indicates it was open */}
        <ReactQueryModal
          key="react-query-modal"
          visible={isModalOpen}
          selectedQueryKey={selectedQueryKey}
          onQuerySelect={handleQuerySelect}
          onClose={handleModalDismiss}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          enableSharedModalDimensions={enableSharedModalDimensions}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          selectedMutationId={selectedMutationId}
          onMutationSelect={handleMutationSelect}
        />

        {/* DevTools Console - Auto-opens if restored state indicates it was open */}
        <DevToolsConsole
          key="devtools-console-modal"
          visible={isDebugModalOpen}
          onClose={handleDebugModalDismiss}
          requiredEnvVars={requiredEnvVars}
          getSentrySubtitle={getSentrySubtitle}
          getRnBetterDevToolsSubtitle={getRnBetterDevToolsSubtitle}
          envVarsSubtitle={envVarsSubtitle}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          enableSharedModalDimensions={enableSharedModalDimensions}
          onReactQueryPress={handleQueryPress}
          onSettingsChange={() => {
            // Reload settings from storage after a delay to ensure they're saved
            // Using longer delay to avoid race conditions
            setTimeout(() => {
              reloadSettings();
            }, 300);
          }}
        />

        {/* Environment Variables Modal */}
        <EnvVarsModal
          key="env-vars-modal"
          visible={isEnvModalOpen}
          onClose={() => setIsEnvModalOpen(false)}
          requiredEnvVars={requiredEnvVars}
          _envVarsSubtitle={envVarsSubtitle}
          enableSharedModalDimensions={enableSharedModalDimensions}
        />

        {/* Sentry Events Modal */}
        <SentryLogsModal
          key="sentry-logs-modal"
          visible={isSentryModalOpen}
          onClose={() => setIsSentryModalOpen(false)}
          getSentrySubtitle={getSentrySubtitle}
          enableSharedModalDimensions={enableSharedModalDimensions}
        />

        {/* Storage Browser Modal */}
        <StorageModal
          key="storage-modal"
          visible={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
          enableSharedModalDimensions={enableSharedModalDimensions}
          requiredStorageKeys={requiredEnvVars}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
