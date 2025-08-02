import React from "react";
import { ScrollView } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileText, Settings, FlaskConical } from "lucide-react-native";
import { DebugSection } from "./ReusableDebugModal";
import { SentryEventLogDumpModalContent } from "../sections/log-dump/SentryEventLogDumpModalContent";
import { EnvVarsContent, RequiredEnvVar } from "../sections/env-vars";
import DevTools from "../../../../DevTools";

interface DebugSectionsFactoryProps {
  queryClient: QueryClient;
  requiredEnvVars: RequiredEnvVar[];
  getSentrySubtitle: () => string;
  getReactQuerySubtitle: () => string;
  envVarsSubtitle: string;
  onClose: () => void;
}

/**
 * Factory component for creating debug sections configuration
 * Follows "Prefer Composition over Configuration" principle by encapsulating
 * section creation logic in a dedicated component rather than inline objects
 */
export function DebugSectionsFactory({
  queryClient,
  requiredEnvVars,
  getSentrySubtitle,
  getReactQuerySubtitle,
  envVarsSubtitle,
  onClose,
}: DebugSectionsFactoryProps) {
  // This component doesn't render UI, it creates configuration
  // Following composition principles for section factory pattern
  return null;
}

/**
 * Hook that generates sections configuration using the factory pattern
 * Separates configuration logic from UI rendering concerns
 */
export function useDebugSections({
  queryClient,
  requiredEnvVars,
  getSentrySubtitle,
  getReactQuerySubtitle,
  envVarsSubtitle,
}: Omit<DebugSectionsFactoryProps, "onClose">): DebugSection[] {
  return [
    {
      id: "sentry-logs",
      title: "Sentry Logs",
      subtitle: getSentrySubtitle(),
      icon: FileText,
      iconColor: "#8B5CF6",
      iconBackgroundColor: "rgba(139, 92, 246, 0.1)",
      content: (onClose) => (
        <SentryEventLogDumpModalContent onClose={onClose} />
      ),
    },
    {
      id: "env-vars",
      title: "Environment Variables",
      subtitle: envVarsSubtitle,
      icon: Settings,
      iconColor: "#10B981",
      iconBackgroundColor: "rgba(16, 185, 129, 0.1)",
      content: (onClose) => (
        <ScrollView
          style={{ flex: 1, backgroundColor: "#2A2A2A" }}
          contentContainerStyle={{ padding: 24 }}
        >
          <EnvVarsContent requiredEnvVars={requiredEnvVars} />
        </ScrollView>
      ),
      onClose: () => {
        // Clean up any state when leaving the env vars section
      },
    },
    {
      id: "react-query",
      title: "React Query Dev Tools",
      subtitle: getReactQuerySubtitle(),
      icon: FlaskConical,
      iconColor: "#F59E0B",
      iconBackgroundColor: "rgba(245, 158, 11, 0.1)",
      content: (onClose) => (
        <QueryClientProvider client={queryClient}>
          <DevTools
            setShowDevTools={onClose}
            containerHeight={600} // Default height
          />
        </QueryClientProvider>
      ),
    },
  ];
}
