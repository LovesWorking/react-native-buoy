import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useDynamicBubbleWidth,
  useDragGesture,
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
import { DevToolsConsole, useDebugSections } from "../DevToolsConsole";

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
    isDragging,
    selectedQueryKey,
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
    setDraggingState,
  } = useModalManager();

  // Dynamic width measurement - automatically adapts to content changes
  const { contentRef, bubbleWidth, isFirstMeasurement } =
    useDynamicBubbleWidth();
  const { panGesture, translateX, translateY } = useDragGesture({
    bubbleWidth,
    onDraggingChange: setDraggingState,
    storageKey: "rn_better_dev_tools_bubble",
  });

  // Create stable drag state object to reduce prop drilling
  const dragState = {
    translateX,
    translateY,
    panGesture,
    isDragging,
  };

  const isAModalOpen = isModalOpen || isDebugModalOpen;
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CopyContextProvider onCopy={onCopy}>
          {/* Bubble Presentation - Pure UI component following composition principles */}
          {!isAModalOpen && (
            <BubblePresentation
              environment={environment}
              userRole={userRole}
              dragState={dragState}
              bubbleWidth={bubbleWidth}
              contentRef={contentRef}
              onStatusPress={handleStatusPress}
              onQueryPress={handleQueryPress}
              config={config}
            />
          )}

          {/* Floating Data Editor Modal */}
          <ReactQueryModal
            visible={isModalOpen}
            selectedQueryKey={selectedQueryKey}
            onQuerySelect={handleQuerySelect}
            onClose={handleModalDismiss}
          />

          {/* DevTools Console - Specialized component for debug sections */}
          <DevToolsConsole
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
