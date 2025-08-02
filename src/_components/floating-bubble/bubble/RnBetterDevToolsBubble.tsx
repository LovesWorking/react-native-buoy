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
}

export function RnBetterDevToolsBubble({
  queryClient,
  userRole,
  environment,
  requiredEnvVars = [],
  onCopy,
  config = {},
}: RnBetterDevToolsBubbleProps) {
  // Specialized hooks for different concerns following composition principles
  const { getSentrySubtitle } = useSentryEvents();
  const { getRnBetterDevToolsSubtitle } = useReactQueryState(queryClient);
  const envVarsSubtitle = useEnvVarsSubtitle(requiredEnvVars);

  // Modal management hook - extracted from main component logic
  const {
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
  } = useModalManager();

  // Hide bubble when any modal is open to prevent visual overlap
  const isAnyModalOpen = isModalOpen || isDebugModalOpen;

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

          {/* Floating Data Editor Modal */}
          <ReactQueryModal
            key="react-query-modal"
            visible={isModalOpen}
            selectedQueryKey={selectedQueryKey}
            onQuerySelect={handleQuerySelect}
            onClose={handleModalDismiss}
          />

          {/* DevTools Console - Specialized component for debug sections */}
          <DevToolsConsole
            key="devtools-console-modal"
            visible={isDebugModalOpen}
            onClose={handleDebugModalDismiss}
            requiredEnvVars={requiredEnvVars}
            getSentrySubtitle={getSentrySubtitle}
            getRnBetterDevToolsSubtitle={getRnBetterDevToolsSubtitle}
            envVarsSubtitle={envVarsSubtitle}
          />
        </CopyContextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
