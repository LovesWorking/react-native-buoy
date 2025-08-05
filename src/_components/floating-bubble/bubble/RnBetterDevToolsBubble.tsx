import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSentrySubtitle } from "../../../_sections/sentry";
import { RequiredEnvVar, useEnvVarsSubtitle } from "../../../_sections/env";
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
   * Only applies when environment prop is provided
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
   * This button opens the React Query dev tools modal
   * @default false
   */
  hideQueryButton?: boolean;

  /**
   * Hide the WiFi toggle button in the bubble
   * This button allows toggling WiFi on/off for testing
   * @default false
   */
  hideWifiToggle?: boolean;
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
 * @example
 * ```tsx
 * <RnBetterDevToolsBubble
 *   queryClient={queryClient}
 *   environment="dev"
 *   userRole="admin"
 *   requiredEnvVars={[
 *     { name: "API_URL", description: "Backend API endpoint" },
 *     { name: "AUTH_TOKEN", description: "Authentication token" }
 *   ]}
 *   hideWifiToggle={true} // Hide the WiFi toggle if not needed
 * />
 * ```
 */
export function RnBetterDevToolsBubble({
  queryClient,
  userRole,
  environment,
  requiredEnvVars = [],
  enableSharedModalDimensions = false,
  hideEnvironment = false,
  hideUserStatus = false,
  hideQueryButton = false,
  hideWifiToggle = false,
}: RnBetterDevToolsBubbleProps) {
  // Specialized hooks for different concerns following composition principles
  const { getSentrySubtitle } = useSentrySubtitle();
  const { getRnBetterDevToolsSubtitle } = useReactQueryState(queryClient);
  const envVarsSubtitle = useEnvVarsSubtitle(requiredEnvVars);

  // Modal management hook with persistence - extracted from main component logic
  const {
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    isStateRestored,
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

  // Hide bubble when any modal is open to prevent visual overlap
  const isAnyModalOpen = isModalOpen || isDebugModalOpen;

  // Don't render anything until state is restored to prevent flash
  if (!isStateRestored) {
    return null;
  }

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
            config={{
              showEnvironment: !hideEnvironment,
              showUserStatus: !hideUserStatus,
              showQueryButton: !hideQueryButton,
              showWifiToggle: !hideWifiToggle,
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
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
