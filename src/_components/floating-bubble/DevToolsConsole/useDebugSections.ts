import React from "react";
import { ScrollView } from "react-native";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { FileText, Settings, FlaskConical } from "lucide-react-native";
import { DebugSection } from "./DevToolsConsole";
import { SentryEventLogDumpModalContent } from "../admin/sections/log-dump/SentryEventLogDumpModalContent";
import { EnvVarsContent, RequiredEnvVar } from "../admin/sections/env-vars";
import DevTools from "../../../DevTools";

interface DebugSectionsConfig {
  requiredEnvVars: RequiredEnvVar[];
  getSentrySubtitle: () => string;
  getRnBetterDevToolsSubtitle: () => string;
  envVarsSubtitle: string;
}

/**
 * Hook that generates sections configuration for the DevTools Console
 * Separates configuration logic from UI rendering concerns
 */
export function useDebugSections({
  requiredEnvVars,
  getSentrySubtitle,
  getRnBetterDevToolsSubtitle,
  envVarsSubtitle,
}: DebugSectionsConfig): DebugSection[] {
  const queryClient = useQueryClient();
  return [
    {
      id: "sentry-logs",
      title: "Sentry Logs",
      subtitle: getSentrySubtitle(),
      icon: FileText,
      iconColor: "#8B5CF6",
      iconBackgroundColor: "rgba(139, 92, 246, 0.1)",
      content: (onClose) =>
        React.createElement(SentryEventLogDumpModalContent, { onClose }),
    },
    {
      id: "env-vars",
      title: "Environment Variables",
      subtitle: envVarsSubtitle,
      icon: Settings,
      iconColor: "#10B981",
      iconBackgroundColor: "rgba(16, 185, 129, 0.1)",
      content: (onClose) =>
        React.createElement(
          ScrollView,
          {
            style: { flex: 1, backgroundColor: "#2A2A2A" },
            contentContainerStyle: { padding: 24 },
          },
          React.createElement(EnvVarsContent, { requiredEnvVars })
        ),
      onClose: () => {
        // Clean up any state when leaving the env vars section
      },
    },
    {
      id: "rn-better-dev-tools",
      title: "RN Better Dev Tools",
      subtitle: getRnBetterDevToolsSubtitle(),
      icon: FlaskConical,
      iconColor: "#F59E0B",
      iconBackgroundColor: "rgba(245, 158, 11, 0.1)",
      content: (onClose) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(DevTools, {
            setShowDevTools: onClose,
            containerHeight: 600,
          })
        ),
    },
  ];
}
