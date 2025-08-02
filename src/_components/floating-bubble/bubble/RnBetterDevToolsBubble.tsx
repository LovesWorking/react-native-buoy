import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useBubbleWidth,
  useDragGesture,
  useWifiState,
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
  useDebugSections,
} from "../admin/components";
import { ErrorBoundary } from "../admin/components/ErrorBoundary";
import { ReactQueryModal } from "../reactQueryModal/ReactQueryModal";
import { ReusableDebugModal } from "../admin/components/ReusableDebugModal";

interface RnBetterDevToolsBubbleProps {
  queryClient: QueryClient;
  userRole: UserRole;
  environment: Environment;
  requiredEnvVars?: RequiredEnvVar[];
  onCopy?: ClipboardFunction;
}

export function RnBetterDevToolsBubble({
  queryClient,
  userRole,
  environment,
  requiredEnvVars = [],
  onCopy,
}: RnBetterDevToolsBubbleProps) {
  // Specialized hooks for different concerns following composition principles
  const { getSentrySubtitle } = useSentryEvents();
  const { getRnBetterDevToolsSubtitle } = useReactQueryState(queryClient);
  const envVarsSubtitle = useEnvVarsSubtitle(requiredEnvVars);

  // Modal management hook - extracted from main component logic
  const {
    isModalOpen,
    isDebugModalOpen,
    isDragging,
    selectedQueryKey,
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
    setDraggingState,
  } = useModalManager();

  // UI state management hooks
  const { bubbleWidth, handleEnvLabelLayout, handleStatusLayout } =
    useBubbleWidth({ hasQueryButton: true });
  const { panGesture, translateX, translateY } = useDragGesture({
    bubbleWidth,
    onDraggingChange: setDraggingState,
    storageKey: "rn_better_dev_tools_bubble",
  });

  // Sections configuration using composition pattern
  const debugSections = useDebugSections({
    queryClient,
    requiredEnvVars,
    getSentrySubtitle,
    getRnBetterDevToolsSubtitle,
    envVarsSubtitle,
  });

  const handleQueryLayout = () => {
    // Layout handler for the query button - can be empty for now
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Bubble Presentation - Pure UI component following composition principles */}
        {!isModalOpen && !isDebugModalOpen && (
          <BubblePresentation
            environment={environment}
            userRole={userRole}
            isDragging={isDragging}
            bubbleWidth={bubbleWidth}
            translateX={translateX}
            translateY={translateY}
            panGesture={panGesture}
            onEnvironmentLayout={handleEnvLabelLayout}
            onStatusLayout={handleStatusLayout}
            onQueryLayout={handleQueryLayout}
            onStatusPress={handleStatusPress}
            onQueryPress={handleQueryPress}
          />
        )}

        {/* Floating Data Editor Modal */}
        <ErrorBoundary>
          <ReactQueryModal
            visible={isModalOpen}
            selectedQueryKey={selectedQueryKey}
            onQuerySelect={handleQuerySelect}
            onClose={handleModalDismiss}
          />
        </ErrorBoundary>

        {/* Copy Context Provider - Specialized component for copy functionality */}
        <CopyContextProvider onCopy={onCopy}>
          <ReusableDebugModal
            visible={isDebugModalOpen}
            onClose={handleDebugModalDismiss}
            sections={debugSections}
            modalTitle="Dev Tools Console"
          />
        </CopyContextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
