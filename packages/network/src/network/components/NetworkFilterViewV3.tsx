import {
  CheckCircle,
  Clock,
  DynamicFilterView,
  Film,
  FileJson,
  FileText,
  Filter,
  Globe,
  Image,
  macOSColors,
  Music,
  type DynamicFilterConfig,
  XCircle,
} from "@react-buoy/shared-ui";
import type { NetworkEvent } from "../types";
import { useCallback, useMemo } from "react";

interface NetworkFilter {
  status?: "all" | "success" | "error" | "pending";
  method?: string[];
  contentType?: string[];
  searchText?: string;
}

interface NetworkFilterViewV3Props {
  events: NetworkEvent[];
  filter: NetworkFilter;
  onFilterChange: (filter: NetworkFilter) => void;
  ignoredPatterns?: Set<string>;
  onTogglePattern?: (pattern: string) => void;
  onAddPattern?: (pattern: string) => void;
}

function getContentType(event: NetworkEvent): { type: string; color: string } {
  const headers = event.responseHeaders || event.requestHeaders;
  const contentType =
    headers?.["content-type"] || headers?.["Content-Type"] || "";

  if (contentType.includes("json"))
    return { type: "JSON", color: macOSColors.semantic.info };
  if (contentType.includes("xml"))
    return { type: "XML", color: macOSColors.semantic.success };
  if (contentType.includes("html"))
    return { type: "HTML", color: macOSColors.semantic.warning };
  if (contentType.includes("text"))
    return { type: "TEXT", color: macOSColors.semantic.success };
  if (contentType.includes("image"))
    return { type: "IMAGE", color: macOSColors.semantic.error };
  if (contentType.includes("video"))
    return { type: "VIDEO", color: macOSColors.semantic.error };
  if (contentType.includes("audio"))
    return { type: "AUDIO", color: macOSColors.semantic.debug };
  if (contentType.includes("form"))
    return { type: "FORM", color: macOSColors.semantic.info };
  return { type: "OTHER", color: macOSColors.text.muted };
}

function getContentTypeIcon(type: string) {
  switch (type) {
    case "JSON":
      return FileJson;
    case "HTML":
    case "XML":
    case "TEXT":
      return FileText;
    case "IMAGE":
      return Image;
    case "VIDEO":
      return Film;
    case "AUDIO":
      return Music;
    default:
      return Globe;
  }
}

function getMethodColor(method: string) {
  switch (method) {
    case "GET":
      return macOSColors.semantic.success;
    case "POST":
      return macOSColors.semantic.info;
    case "PUT":
      return macOSColors.semantic.warning;
    case "DELETE":
      return macOSColors.semantic.error;
    case "PATCH":
      return macOSColors.semantic.success;
    default:
      return macOSColors.text.muted;
  }
}

export function NetworkFilterViewV3({
  events,
  filter,
  onFilterChange,
  ignoredPatterns = new Set(),
  onTogglePattern = () => {},
  onAddPattern = () => {},
}: NetworkFilterViewV3Props) {
  const statusCounts = useMemo(() => {
    const counts = {
      all: events.length,
      success: 0,
      error: 0,
      pending: 0,
    };

    events.forEach((event) => {
      if (event.error || (event.status && event.status >= 400)) {
        counts.error += 1;
        return;
      }

      if (event.status && event.status >= 200 && event.status < 300) {
        counts.success += 1;
        return;
      }

      if (!event.status && !event.error) {
        counts.pending += 1;
      }
    });

    return counts;
  }, [events]);

  const methodCounts = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!event.method) return acc;
      acc[event.method] = (acc[event.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [events]);

  const contentTypeCounts = useMemo(() => {
    return events.reduce((acc, event) => {
      const { type } = getContentType(event);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [events]);

  const availableDomains = useMemo(() => {
    const domains = new Set<string>();

    events.forEach((event) => {
      if (event.host) {
        domains.add(event.host);
        return;
      }

      try {
        if (event.url) {
          const parsed = new URL(event.url);
          if (parsed.host) domains.add(parsed.host);
        }
      } catch {
        // Ignore relative URLs
      }
    });

    return Array.from(domains)
      .filter((domain) => domain && domain !== "")
      .sort((a, b) => a.localeCompare(b));
  }, [events]);

  const availableUrls = useMemo(() => {
    const urls = new Set<string>();

    events.forEach((event) => {
      if (!event.url) return;
      try {
        const parsed = new URL(event.url);
        const normalized = `${parsed.origin}${parsed.pathname}`;
        urls.add(normalized);
      } catch {
        // URL constructor fails for relative paths - fall back to raw value
        urls.add(event.url);
      }
    });

    return Array.from(urls)
      .filter((url) => url && url !== "")
      .sort((a, b) => a.localeCompare(b));
  }, [events]);

  const suggestionItems = useMemo(() => {
    const maxItemsPerGroup = 30;
    const domainSuggestions = availableDomains.slice(0, maxItemsPerGroup);
    const urlSuggestions = availableUrls.slice(0, maxItemsPerGroup);

    return [...domainSuggestions, ...urlSuggestions];
  }, [availableDomains, availableUrls]);

  const handleDynamicFilterChange = useCallback(
    (optionId: string, value: unknown) => {
      const [group] = optionId.split("::");

      if (group === "status") {
        const nextStatus = value === "all" ? undefined : (value as typeof filter.status);
        onFilterChange({ ...filter, status: nextStatus });
        return;
      }

      if (group === "method") {
        const methodValue = String(value);
        const currentMethods = filter.method || [];
        const hasMethod = currentMethods.includes(methodValue);
        const updatedMethods = hasMethod
          ? currentMethods.filter((method) => method !== methodValue)
          : [methodValue];

        onFilterChange({
          ...filter,
          method: updatedMethods.length > 0 ? updatedMethods : undefined,
        });
        return;
      }

      if (group === "contentType") {
        const typeValue = String(value);
        const currentTypes = filter.contentType || [];
        const hasType = currentTypes.includes(typeValue);
        const updatedTypes = hasType
          ? currentTypes.filter((type) => type !== typeValue)
          : [typeValue];

        onFilterChange({
          ...filter,
          contentType: updatedTypes.length > 0 ? updatedTypes : undefined,
        });
      }
    },
    [filter, onFilterChange]
  );

  const filterSections = useMemo((): DynamicFilterConfig["sections"] => {
    const sections: NonNullable<DynamicFilterConfig["sections"]> = [];

    sections.push({
      id: "status",
      title: "Status",
      type: "status",
      data: (["all", "success", "error", "pending"] as const).map((status) => ({
        id: `status::${status}`,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count: statusCounts[status],
        icon:
          status === "success"
            ? CheckCircle
            : status === "error"
            ? XCircle
            : status === "pending"
            ? Clock
            : Globe,
        color:
          status === "success"
            ? macOSColors.semantic.success
            : status === "error"
            ? macOSColors.semantic.error
            : status === "pending"
            ? macOSColors.semantic.warning
            : macOSColors.semantic.info,
        isActive:
          filter.status === status || (!filter.status && status === "all"),
        value: status,
      })),
    });

    const methodEntries = Object.entries(methodCounts);
    if (methodEntries.length > 0) {
      sections.push({
        id: "method",
        title: "Method",
        type: "method",
        data: methodEntries.map(([method, count]) => ({
          id: `method::${method}`,
          label: method,
          count,
          color: getMethodColor(method),
          isActive: filter.method?.includes(method) ?? false,
          value: method,
        })),
      });
    }

    const contentTypeEntries = Object.entries(contentTypeCounts);
    if (contentTypeEntries.length > 0) {
      sections.push({
        id: "contentType",
        title: "Content Type",
        type: "contentType",
        data: contentTypeEntries.map(([type, count]) => {
          const representativeEvent = events.find(
            (event) => getContentType(event).type === type
          );
          const { color } = representativeEvent
            ? getContentType(representativeEvent)
            : { color: macOSColors.text.muted };

          return {
            id: `contentType::${type}`,
            label: type,
            count,
            icon: getContentTypeIcon(type),
            color,
            isActive: filter.contentType?.includes(type) ?? false,
            value: type,
          };
        }),
      });
    }

    return sections;
  }, [contentTypeCounts, events, filter.contentType, filter.method, filter.status, methodCounts, statusCounts]);

  const dynamicFilterConfig = useMemo<DynamicFilterConfig>(() => ({
    sections: filterSections,
    addFilterSection: {
      enabled: true,
      placeholder: "Enter domain or URL pattern...",
      title: "ACTIVE FILTERS",
      icon: Filter,
    },
    availableItemsSection: {
      enabled: true,
      title: "AVAILABLE DOMAINS & URLS",
      emptyMessage:
        "No network events captured yet. Domains and URLs will appear here.",
      items: suggestionItems,
    },
    howItWorksSection: {
      enabled: true,
      title: "HOW NETWORK FILTERS WORK",
      description:
        "Patterns hide matching requests from the network event list. Filters match if the domain or URL contains the provided text.",
      examples: [
        "• example.com → filters any request whose host includes example.com",
        "• https://api.example.com/v1/users → filters that exact endpoint",
        "• /health → filters any URL path containing /health",
      ],
      icon: Filter,
    },
    onFilterChange: handleDynamicFilterChange,
    onPatternAdd: onAddPattern,
    onPatternToggle: onTogglePattern,
    activePatterns: ignoredPatterns,
  }), [
    filterSections,
    handleDynamicFilterChange,
    ignoredPatterns,
    onAddPattern,
    onTogglePattern,
    suggestionItems,
  ]);

  return <DynamicFilterView {...dynamicFilterConfig} />;
}
