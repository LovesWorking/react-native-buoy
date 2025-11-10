import {
  DynamicFilterView,
  type DynamicFilterConfig,
  macOSColors,
  FileText,
  FileCode,
  Link,
  Zap,
  Copy,
  Settings,
  Hash,
  Eye,
  ToolbarCopyButton,
  formatRelativeTime,
} from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";
import { useCallback, useMemo } from "react";
import { Text, StyleSheet, ScrollView, View } from "react-native";
import type { NetworkEvent } from "../types";
import { useTickEveryMinute } from "../hooks/useTickEveryMinute";

export interface CopySettings {
  // Request Info
  includeMethod: boolean;
  includeStatus: boolean;
  includeDuration: boolean;
  includeTimestamp: boolean;
  includeClient: boolean;
  includeSizes: boolean;
  includeErrors: boolean;

  // Headers
  includeRequestHeaders: boolean;
  includeResponseHeaders: boolean;

  // Body/Payload
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  bodySizeThreshold: 10 | 50 | 100 | -1; // -1 means no limit

  // Format
  format: "markdown" | "json" | "plaintext";

  // Filters
  filterMode: "all" | "failed" | "success";
}

export const DEFAULT_COPY_SETTINGS: CopySettings = {
  includeMethod: true,
  includeStatus: true,
  includeDuration: true,
  includeTimestamp: true,
  includeClient: true,
  includeSizes: true,
  includeErrors: true,
  includeRequestHeaders: true,
  includeResponseHeaders: true,
  includeRequestBody: true,
  includeResponseBody: true,
  bodySizeThreshold: 10,
  format: "markdown",
  filterMode: "all",
};

// Preset configurations for comparison
const PRESET_CONFIGS = {
  urls: {
    includeMethod: true,
    includeStatus: false,
    includeDuration: false,
    includeTimestamp: false,
    includeClient: false,
    includeSizes: false,
    includeErrors: false,
    includeRequestHeaders: false,
    includeResponseHeaders: false,
    includeRequestBody: false,
    includeResponseBody: false,
    bodySizeThreshold: 10,
    format: "plaintext" as const,
    filterMode: "all" as const,
  },
  llm: {
    includeMethod: true,
    includeStatus: true,
    includeDuration: true,
    includeTimestamp: true,
    includeClient: true,
    includeSizes: true,
    includeErrors: true,
    includeRequestHeaders: true,
    includeResponseHeaders: true,
    includeRequestBody: true,
    includeResponseBody: true,
    bodySizeThreshold: 10,
    format: "markdown" as const,
    filterMode: "all" as const,
  },
  json: {
    includeMethod: true,
    includeStatus: true,
    includeDuration: true,
    includeTimestamp: true,
    includeClient: true,
    includeSizes: true,
    includeErrors: true,
    includeRequestHeaders: true,
    includeResponseHeaders: true,
    includeRequestBody: true,
    includeResponseBody: true,
    bodySizeThreshold: -1,
    format: "json" as const,
    filterMode: "all" as const,
  },
  full: {
    includeMethod: true,
    includeStatus: true,
    includeDuration: true,
    includeTimestamp: true,
    includeClient: true,
    includeSizes: true,
    includeErrors: true,
    includeRequestHeaders: true,
    includeResponseHeaders: true,
    includeRequestBody: true,
    includeResponseBody: true,
    bodySizeThreshold: -1,
    format: "markdown" as const,
    filterMode: "all" as const,
  },
} as const;

interface NetworkCopySettingsViewProps {
  settings: CopySettings;
  onSettingsChange: (settings: CopySettings) => void;
  events?: NetworkEvent[];
}

// Detect which preset matches current settings
function detectActivePreset(settings: CopySettings): string | null {
  for (const [presetName, presetConfig] of Object.entries(PRESET_CONFIGS)) {
    const matches = Object.keys(presetConfig).every(
      (key) => presetConfig[key as keyof typeof presetConfig] === settings[key as keyof CopySettings]
    );
    if (matches) return presetName;
  }
  return null; // No preset matches = Custom
}

export function NetworkCopySettingsView({
  settings,
  onSettingsChange,
  events = [],
}: NetworkCopySettingsViewProps) {
  // Use tick for updating relative time
  const tick = useTickEveryMinute();

  // Auto-detect if we have live data
  const hasLiveData = events.length > 0;

  // Get the most recent event timestamp for "last updated" display
  const lastEventTimestamp = useMemo(() => {
    if (!hasLiveData) return null;
    const timestamps = events.map(e => typeof e.timestamp === 'number' ? e.timestamp : new Date(e.timestamp).getTime());
    return Math.max(...timestamps);
  }, [events, hasLiveData]);

  // Detect active preset
  const activePreset = useMemo(() => detectActivePreset(settings), [settings]);

  // Quick preset handlers
  const applyUrlsPreset = useCallback(() => {
    onSettingsChange(PRESET_CONFIGS.urls);
  }, [onSettingsChange]);

  const applyLLMPreset = useCallback(() => {
    onSettingsChange(PRESET_CONFIGS.llm);
  }, [onSettingsChange]);

  const applyJSONPreset = useCallback(() => {
    onSettingsChange(PRESET_CONFIGS.json);
  }, [onSettingsChange]);

  const applyFullPreset = useCallback(() => {
    onSettingsChange(PRESET_CONFIGS.full);
  }, [onSettingsChange]);

  // Handle individual option changes
  const handleOptionChange = useCallback(
    (optionId: string, value: unknown) => {
      const [group, key] = optionId.split("::");

      if (group === "preset") {
        switch (key) {
          case "urls":
            applyUrlsPreset();
            break;
          case "llm":
            applyLLMPreset();
            break;
          case "json":
            applyJSONPreset();
            break;
          case "full":
            applyFullPreset();
            break;
        }
        return;
      }

      if (group === "requestInfo") {
        // Toggle boolean value
        onSettingsChange({ ...settings, [key]: !settings[key as keyof CopySettings] });
        return;
      }

      if (group === "headers") {
        // Toggle boolean value
        onSettingsChange({ ...settings, [key]: !settings[key as keyof CopySettings] });
        return;
      }

      if (group === "body") {
        if (key === "bodySizeThreshold") {
          onSettingsChange({ ...settings, bodySizeThreshold: value as CopySettings["bodySizeThreshold"] });
        } else {
          // Toggle boolean value
          onSettingsChange({ ...settings, [key]: !settings[key as keyof CopySettings] });
        }
        return;
      }

      if (group === "format") {
        onSettingsChange({ ...settings, format: value as CopySettings["format"] });
        return;
      }

      if (group === "filter") {
        onSettingsChange({ ...settings, filterMode: value as CopySettings["filterMode"] });
      }
    },
    [settings, onSettingsChange, applyUrlsPreset, applyLLMPreset, applyJSONPreset, applyFullPreset]
  );

  // Mock data for preview
  const mockRequestData = useMemo(() => ({
    method: "POST",
    url: "https://api.example.com/v1/users",
    status: 201,
    duration: 342,
    timestamp: new Date().toISOString(),
    requestHeaders: {
      "Content-Type": "application/json",
      "Authorization": "Bearer ***",
    },
    responseHeaders: {
      "Content-Type": "application/json",
      "X-Request-ID": "abc123",
    },
    requestBody: {
      name: "John Doe",
      email: "john@example.com",
    },
    responseBody: {
      id: "user_123",
      name: "John Doe",
      email: "john@example.com",
      createdAt: "2025-01-10T12:00:00Z",
    },
  }), []);

  // Get data source - auto-detect live vs mock
  const previewData = useMemo(() => {
    if (hasLiveData) {
      return events; // Show ALL events
    }
    // Mock data - return as array for consistency
    return [mockRequestData];
  }, [hasLiveData, events, mockRequestData]);

  // Generate copy text - should match preview content exactly
  const generateCopyText = useCallback(() => {
    const dataSource = hasLiveData ? events : [mockRequestData];

    const {
      format,
      includeMethod,
      includeStatus,
      includeTimestamp,
      includeRequestHeaders,
      includeRequestBody,
      includeResponseBody,
    } = settings;

    // Build filtered data for a single event
    const buildFilteredData = (eventData: any) => {
      const data: any = {};

      if (includeMethod) {
        data.method = eventData.method;
        data.url = eventData.url;
      }
      if (includeStatus) {
        data.status = eventData.status;
        data.duration = eventData.duration;
      }
      if (includeTimestamp) {
        data.timestamp = eventData.timestamp;
      }
      if (includeRequestHeaders) {
        data.requestHeaders = eventData.requestHeaders;
      }
      if (includeRequestBody) {
        data.requestBody = ('requestBody' in eventData) ? eventData.requestBody : eventData.requestData;
      }
      if (includeResponseBody) {
        data.responseBody = ('responseBody' in eventData) ? eventData.responseBody : eventData.responseData;
      }

      return data;
    };

    if (format === "json") {
      const allFilteredData = dataSource.map(buildFilteredData);
      return JSON.stringify(allFilteredData, null, 2);
    }

    if (format === "markdown") {
      const allRequests = dataSource.map((eventData, index) => {
        const sections: string[] = [];

        sections.push(`# Request ${index + 1}`);

        if (includeMethod) {
          sections.push(`\n**${eventData.method}** ${eventData.url}`);
        }

        const metaInfo: string[] = [];
        if (includeStatus) {
          metaInfo.push(`**Status:** ${eventData.status}`);
          metaInfo.push(`**Duration:** ${eventData.duration}ms`);
        }
        if (includeTimestamp) {
          metaInfo.push(`**Timestamp:** ${eventData.timestamp}`);
        }
        if (metaInfo.length > 0) {
          sections.push('\n' + metaInfo.join('\n'));
        }

        if (includeRequestHeaders) {
          const headers = eventData.requestHeaders || {};
          sections.push(`\n## Request Headers\n\`\`\`json\n${JSON.stringify(headers, null, 2)}\n\`\`\``);
        }

        if (includeRequestBody) {
          const body = ('requestBody' in eventData) ? eventData.requestBody : eventData.requestData;
          sections.push(`\n## Request Body\n\`\`\`json\n${JSON.stringify(body || {}, null, 2)}\n\`\`\``);
        }

        if (includeResponseBody) {
          const body = ('responseBody' in eventData) ? eventData.responseBody : eventData.responseData;
          sections.push(`\n## Response Body\n\`\`\`json\n${JSON.stringify(body || {}, null, 2)}\n\`\`\``);
        }

        return sections.join('\n');
      });

      return allRequests.join('\n\n---\n\n') || "No data included";
    }

    // Plaintext
    const allRequests = dataSource.map((eventData, index) => {
      const lines: string[] = [];

      lines.push(`Request ${index + 1}:`);

      if (includeMethod) {
        lines.push(`${eventData.method} ${eventData.url}`);
      }
      if (includeStatus) {
        lines.push(`Status: ${eventData.status}`);
        lines.push(`Duration: ${eventData.duration}ms`);
      }
      if (includeTimestamp) {
        lines.push(`Timestamp: ${eventData.timestamp}`);
      }

      if (includeRequestBody) {
        const body = ('requestBody' in eventData) ? eventData.requestBody : eventData.requestData;
        lines.push('\nRequest:');
        lines.push(JSON.stringify(body || {}, null, 2));
      }

      if (includeResponseBody) {
        const body = ('responseBody' in eventData) ? eventData.responseBody : eventData.responseData;
        lines.push('\nResponse:');
        lines.push(JSON.stringify(body || {}, null, 2));
      }

      return lines.join('\n');
    });

    return allRequests.join('\n\n---\n\n') || "No data included";
  }, [hasLiveData, events, mockRequestData, settings]);

  // Generate formatted output for copying/preview
  const generatePreviewContent = useCallback(() => {
    const dataSource = hasLiveData ? events : [mockRequestData];

    const {
      format,
      includeMethod,
      includeStatus,
      includeTimestamp,
      includeRequestHeaders,
      includeRequestBody,
      includeResponseBody,
    } = settings;

    // Build filtered data for a single event
    const buildFilteredData = (eventData: any) => {
      const data: any = {};

      if (includeMethod) {
        data.method = eventData.method;
        data.url = eventData.url;
      }
      if (includeStatus) {
        data.status = eventData.status;
        data.duration = eventData.duration;
      }
      if (includeTimestamp) {
        data.timestamp = eventData.timestamp;
      }
      if (includeRequestHeaders) {
        data.requestHeaders = eventData.requestHeaders;
      }
      if (includeRequestBody) {
        data.requestBody = ('requestBody' in eventData) ? eventData.requestBody : eventData.requestData;
      }
      if (includeResponseBody) {
        data.responseBody = ('responseBody' in eventData) ? eventData.responseBody : eventData.responseData;
      }

      return data;
    };

    if (format === "json") {
      const allFilteredData = dataSource.map(buildFilteredData);
      return <DataViewer data={allFilteredData} title="" showTypeFilter={false} />;
    }

    if (format === "markdown") {
      const allRequests = dataSource.map((eventData, index) => {
        const sections: string[] = [];

        sections.push(`# Request ${index + 1}`);

        if (includeMethod) {
          sections.push(`\n**${eventData.method}** ${eventData.url}`);
        }

        const metaInfo: string[] = [];
        if (includeStatus) {
          metaInfo.push(`**Status:** ${eventData.status}`);
          metaInfo.push(`**Duration:** ${eventData.duration}ms`);
        }
        if (includeTimestamp) {
          metaInfo.push(`**Timestamp:** ${eventData.timestamp}`);
        }
        if (metaInfo.length > 0) {
          sections.push('\n' + metaInfo.join('\n'));
        }

        if (includeRequestHeaders) {
          const headers = eventData.requestHeaders || {};
          sections.push(`\n## Request Headers\n\`\`\`json\n${JSON.stringify(headers, null, 2)}\n\`\`\``);
        }

        if (includeRequestBody) {
          const body = ('requestBody' in eventData) ? eventData.requestBody : eventData.requestData;
          sections.push(`\n## Request Body\n\`\`\`json\n${JSON.stringify(body || {}, null, 2)}\n\`\`\``);
        }

        if (includeResponseBody) {
          const body = ('responseBody' in eventData) ? eventData.responseBody : eventData.responseData;
          sections.push(`\n## Response Body\n\`\`\`json\n${JSON.stringify(body || {}, null, 2)}\n\`\`\``);
        }

        return sections.join('\n');
      });

      const markdown = allRequests.join('\n\n---\n\n');

      return (
        <ScrollView style={styles.previewScroll} nestedScrollEnabled>
          <Text style={styles.markdownText}>{markdown || "No data included"}</Text>
        </ScrollView>
      );
    }

    // Plaintext
    const allRequests = dataSource.map((eventData, index) => {
      const lines: string[] = [];

      lines.push(`Request ${index + 1}:`);

      if (includeMethod) {
        lines.push(`${eventData.method} ${eventData.url}`);
      }
      if (includeStatus) {
        lines.push(`Status: ${eventData.status}`);
        lines.push(`Duration: ${eventData.duration}ms`);
      }
      if (includeTimestamp) {
        lines.push(`Timestamp: ${eventData.timestamp}`);
      }

      if (includeRequestBody) {
        const body = ('requestBody' in eventData) ? eventData.requestBody : eventData.requestData;
        lines.push('\nRequest:');
        lines.push(JSON.stringify(body || {}, null, 2));
      }

      if (includeResponseBody) {
        const body = ('responseBody' in eventData) ? eventData.responseBody : eventData.responseData;
        lines.push('\nResponse:');
        lines.push(JSON.stringify(body || {}, null, 2));
      }

      return lines.join('\n');
    });

    const plaintext = allRequests.join('\n\n---\n\n');

    return (
      <ScrollView style={styles.previewScroll} nestedScrollEnabled>
        <Text style={styles.plaintextText}>{plaintext || "No data included"}</Text>
      </ScrollView>
    );
  }, [settings, hasLiveData, events, mockRequestData]);

  // Render preview header actions (status label and Copy button)
  const renderPreviewHeaderActions = useCallback(() => {
    const statusLabel = hasLiveData && lastEventTimestamp
      ? `Live data • Updated ${formatRelativeTime(lastEventTimestamp, tick)}`
      : "Mock data (no events captured)";

    return (
      <>
        {/* Status Label */}
        <Text style={styles.statusLabel}>{statusLabel}</Text>

        {/* Copy Button */}
        <ToolbarCopyButton value={generateCopyText()} />
      </>
    );
  }, [hasLiveData, lastEventTimestamp, tick, generateCopyText]);

  // Render preview content only
  const renderPreviewContent = useCallback(() => {
    return generatePreviewContent();
  }, [generatePreviewContent]);

  const dynamicFilterConfig = useMemo<DynamicFilterConfig>(() => ({
    sections: [
      // Quick Presets Section - Hero element
      {
        id: "presets",
        title: "Presets",
        type: "custom" as const,
        data: [
          {
            id: "preset::urls",
            label: "URLs",
            icon: Link,
            color: macOSColors.semantic.info,
            value: "urls",
            isActive: activePreset === "urls",
          },
          {
            id: "preset::llm",
            label: "LLM",
            icon: Zap,
            color: macOSColors.semantic.success,
            value: "llm",
            isActive: activePreset === "llm",
          },
          {
            id: "preset::json",
            label: "JSON",
            icon: FileCode,
            color: macOSColors.semantic.warning,
            value: "json",
            isActive: activePreset === "json",
          },
          {
            id: "preset::full",
            label: "Full",
            icon: FileText,
            color: macOSColors.semantic.info,
            value: "full",
            isActive: activePreset === "full",
          },
          {
            id: "preset::custom",
            label: "Custom",
            icon: Settings,
            color: macOSColors.text.secondary,
            value: "custom",
            isActive: activePreset === null,
          },
        ],
      },

      // Include Section - Consolidated
      {
        id: "include",
        title: "Include",
        type: "custom" as const,
        data: [
          {
            id: "requestInfo::includeMethod",
            label: "URL",
            value: "includeMethod",
            isActive: settings.includeMethod,
          },
          {
            id: "requestInfo::includeStatus",
            label: "Status",
            value: "includeStatus",
            isActive: settings.includeStatus,
          },
          {
            id: "requestInfo::includeTimestamp",
            label: "Time",
            value: "includeTimestamp",
            isActive: settings.includeTimestamp,
          },
          {
            id: "headers::includeRequestHeaders",
            label: "Headers",
            value: "includeRequestHeaders",
            isActive: settings.includeRequestHeaders,
          },
          {
            id: "body::includeRequestBody",
            label: "Req Body",
            value: "includeRequestBody",
            isActive: settings.includeRequestBody,
          },
          {
            id: "body::includeResponseBody",
            label: "Res Body",
            value: "includeResponseBody",
            isActive: settings.includeResponseBody,
          },
          {
            id: "requestInfo::includeErrors",
            label: "Errors",
            value: "includeErrors",
            isActive: settings.includeErrors,
          },
        ],
      },

      // Output Format
      {
        id: "format",
        title: "Format",
        type: "custom" as const,
        data: [
          {
            id: "format::markdown",
            label: "Markdown",
            icon: FileText,
            color: macOSColors.semantic.info,
            value: "markdown",
            isActive: settings.format === "markdown",
          },
          {
            id: "format::json",
            label: "JSON",
            icon: FileCode,
            color: macOSColors.semantic.warning,
            value: "json",
            isActive: settings.format === "json",
          },
          {
            id: "format::plaintext",
            label: "Text",
            icon: Hash,
            color: macOSColors.text.secondary,
            value: "plaintext",
            isActive: settings.format === "plaintext",
          },
        ],
      },
    ],
    previewSection: {
      enabled: true,
      title: "PREVIEW",
      icon: Eye,
      content: renderPreviewContent,
      headerActions: renderPreviewHeaderActions,
    },
    onFilterChange: handleOptionChange,
  }), [settings, handleOptionChange, renderPreviewContent, renderPreviewHeaderActions, activePreset]);

  return <DynamicFilterView {...dynamicFilterConfig} />;
}

const styles = StyleSheet.create({
  previewScroll: {
    maxHeight: 300,
  },
  markdownText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: macOSColors.text.primary,
    lineHeight: 18,
  },
  plaintextText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: macOSColors.text.primary,
    lineHeight: 18,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.muted,
    marginRight: 8,
  },
});
