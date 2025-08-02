import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useBubbleWidth,
  useDragGesture,
  useWifiState,
  useSentryEvents,
  useReactQueryState,
  useModalManager,
} from "./hooks";
import { RequiredEnvVar, useEnvVarsSubtitle } from "./sections/env-vars";
import { type ClipboardFunction } from "../../../context/CopyContext";
import {
  Environment,
  UserRole,
  BubblePresentation,
  CopyContextProvider,
  useDebugSections,
} from "./components";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FloatingDataEditor } from "./components/FloatingDataEditor";
import { ReusableDebugModal } from "./components/ReusableDebugModal";

interface RnBetterDevToolsBubbleProps {
  queryClient: QueryClient;
  userRole: UserRole;
  environment: Environment;
  requiredEnvVars?: RequiredEnvVar[];
  onCopy?: ClipboardFunction;
}

/**
 * RnBetterDevToolsBubble refactored following composition principles:
 * - Decomposed by responsibility into specialized components
 * - Extracted reusable logic into custom hooks
 * - Composed using specialized components instead of large configurations
 */
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
  const { isOnline, handleWifiToggle } = useWifiState();
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
            isOnline={isOnline}
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
            onWifiToggle={handleWifiToggle}
          />
        )}

        {/* Floating Data Editor Modal */}
        <ErrorBoundary>
          <FloatingDataEditor
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
