import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useSentryEvents,
  useReactQueryState,
  useModalManager,
} from "../admin/hooks";
import { RequiredEnvVar, useEnvVarsSubtitle } from "../admin/sections/env-vars";
import { type ClipboardFunction } from "../../../context/CopyContext";
import {
  Environment,
  UserRole,
  BubblePresentation,
  CopyContextProvider,
} from "../admin/components";
import { type BubbleConfig } from "../admin/components/RnBetterDevToolsBubbleContent";
import { ErrorBoundary } from "../admin/components/ErrorBoundary";
import { ReactQueryModal } from "../reactQueryModal/ReactQueryModal";
import { DevToolsConsole } from "../DevToolsConsole";

interface RnBetterDevToolsBubbleProps {
  queryClient: QueryClient;
  userRole?: UserRole;
  environment?: Environment;
  requiredEnvVars?: RequiredEnvVar[];
  onCopy?: ClipboardFunction;
  config?: BubbleConfig;
  enableSharedModalDimensions?: boolean;
}

export function RnBetterDevToolsBubble({
  queryClient,
  userRole,
  environment,
  requiredEnvVars = [],
  onCopy,
  config = {},
  enableSharedModalDimensions = false,
}: RnBetterDevToolsBubbleProps) {
  // Specialized hooks for different concerns following composition principles
  const { getSentrySubtitle } = useSentryEvents();
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
        <CopyContextProvider onCopy={onCopy}>
          {/* Bubble Presentation - Encapsulates all UI logic internally */}
          {/* Hidden when modals are open to prevent visual conflicts */}
          {!isAnyModalOpen && (
            <BubblePresentation
              key="bubble-presentation"
              environment={environment}
              userRole={userRole}
              onStatusPress={handleStatusPress}
              onQueryPress={handleQueryPress}
              config={config}
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
          />
        </CopyContextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
