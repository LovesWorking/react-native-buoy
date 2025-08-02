import React from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react-native";
import { ConsoleSection } from "../ConsoleSection";
import DevTools from "../../../../DevTools";

interface ReactQuerySectionProps {
  onPress: () => void;
  getRnBetterDevToolsSubtitle: () => string;
}

/**
 * React Query section component following composition principles.
 * Encapsulates React Query specific business logic and UI.
 */
export function ReactQuerySection({
  onPress,
  getRnBetterDevToolsSubtitle,
}: ReactQuerySectionProps) {
  return (
    <ConsoleSection
      id="rn-better-dev-tools"
      title="RN Better Dev Tools"
      subtitle={getRnBetterDevToolsSubtitle()}
      icon={FlaskConical}
      iconColor="#F59E0B"
      iconBackgroundColor="rgba(245, 158, 11, 0.1)"
      onPress={onPress}
    />
  );
}

/**
 * Content component for React Query detail view.
 * Provides QueryClient context and renders DevTools component.
 */
export function ReactQueryDetailContent({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <DevTools setShowDevTools={onClose} containerHeight={600} />
    </QueryClientProvider>
  );
}
