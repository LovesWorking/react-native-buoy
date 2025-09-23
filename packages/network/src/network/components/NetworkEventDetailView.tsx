import { useState, type FC, type ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Clock,
  Upload,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  FileJson,
  Filter,
  Globe,
  Link,
  InlineCopyButton,
  macOSColors,
} from "@react-buoy/shared-ui";
import type { NetworkEvent } from "../types";
import {
  formatBytes,
  formatDuration,
  formatHttpStatus,
} from "../utils/formatting";
import { formatRelativeTime } from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";
interface NetworkEventDetailViewProps {
  event: NetworkEvent;
  ignoredPatterns?: Set<string>;
  onTogglePattern?: (pattern: string) => void;
}

// Component for collapsible sections matching Sentry style
const CollapsibleSection: FC<{
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={styles.collapsibleSection}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.collapsibleTitle}>
          {icon}
          <Text style={styles.collapsibleTitleText}>{title}</Text>
        </View>
        {isOpen ? (
          <ChevronUp size={16} color={macOSColors.text.secondary} />
        ) : (
          <ChevronDown size={16} color={macOSColors.text.secondary} />
        )}
      </TouchableOpacity>
      {isOpen ? (
        <View style={styles.collapsibleContent}>{children}</View>
      ) : null}
    </View>
  );
};

// URL breakdown component matching Sentry style
const UrlBreakdown: FC<{ url: string }> = ({ url }) => {
  const parseUrl = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      const isSecure = urlObj.protocol === "https:";

      // Parse query parameters
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return {
        protocol: urlObj.protocol.replace(":", ""),
        host: urlObj.host,
        pathname: urlObj.pathname,
        params: Object.keys(params).length > 0 ? params : null,
        isSecure,
      };
    } catch {
      return {
        protocol: "",
        host: url,
        pathname: "",
        params: null,
        isSecure: false,
      };
    }
  };

  const urlParts = parseUrl(url);

  return (
    <View style={styles.urlBreakdown}>
      <View style={styles.urlRow}>
        {urlParts.isSecure ? (
          <Lock size={12} color={macOSColors.semantic.success} />
        ) : (
          <Unlock size={12} color={macOSColors.semantic.warning} />
        )}
        <Text style={styles.urlDomain}>{urlParts.host}</Text>
        <Text style={styles.urlProtocol}>
          ({urlParts.protocol.toUpperCase()})
        </Text>
        <InlineCopyButton value={url} buttonStyle={styles.copyButton} />
      </View>
      <View style={styles.urlPathRow}>
        <Text style={styles.urlPath}>{urlParts.pathname}</Text>
      </View>
      {urlParts.params ? (
        <View style={styles.urlParams}>
          <Text style={styles.urlParamsTitle}>Query Parameters:</Text>
          {Object.entries(urlParts.params).map(([key, value]) => (
            <Text key={key} style={styles.urlParam}>
              {key}: {value}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

/**
 * Detailed inspector rendering request/response metadata for a single network event. Designed to
 * mimic Sentry’s layout with collapsible sections, diff views, and quick copy affordances.
 */
export function NetworkEventDetailView({
  event,
  ignoredPatterns = new Set(),
  onTogglePattern = () => {},
}: NetworkEventDetailViewProps) {
  const status = event.status ? formatHttpStatus(event.status) : null;
  const isPending = !event.status && !event.error;

  return (
    <ScrollView style={styles.container}>
      {/* Request Details - Always visible */}
      <View style={styles.requestDetailsSection}>
        <View style={styles.httpHeader}>
          <View style={styles.httpMethodBadge}>
            <Text style={styles.httpMethod}>{event.method}</Text>
          </View>
          {event.status ? (
            <View
              style={[
                styles.httpStatusBadge,
                { backgroundColor: `${status?.color}20` },
              ]}
            >
              <Text style={[styles.httpStatusText, { color: status?.color }]}>
                {status?.text} {status?.meaning}
              </Text>
            </View>
          ) : isPending ? (
            <View style={styles.pendingBadge}>
              <Clock size={10} color={macOSColors.semantic.warning} />
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          ) : null}
          {event.duration ? (
            <View style={styles.httpDuration}>
              <Clock size={10} color={macOSColors.text.muted} />
              <Text style={styles.httpDurationText}>
                {formatDuration(event.duration)}
              </Text>
            </View>
          ) : null}
        </View>

        <UrlBreakdown url={event.url} />

        {event.error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={12} color={macOSColors.semantic.error} />
            <Text style={styles.errorText}>{event.error}</Text>
          </View>
        ) : null}
      </View>

      {/* Timing Information - Always visible */}
      <View style={styles.timingSection}>
        <View style={styles.timingRow}>
          <Clock size={12} color={macOSColors.text.secondary} />
          <Text style={styles.timingLabel}>Started:</Text>
          <Text style={styles.timingValue}>
            {formatRelativeTime(event.timestamp)}
          </Text>
          <Text style={styles.timingExact}>
            ({new Date(event.timestamp).toLocaleTimeString()})
          </Text>
        </View>

        {event.requestSize || event.responseSize ? (
          <View style={styles.sizeRow}>
            {event.requestSize !== undefined ? (
              <View style={styles.sizeItem}>
                <Upload size={10} color={macOSColors.semantic.info} />
                <Text style={styles.sizeLabel}>Sent:</Text>
                <Text style={styles.sizeValue}>
                  {formatBytes(event.requestSize)}
                </Text>
              </View>
            ) : null}
            {event.responseSize !== undefined ? (
              <View style={styles.sizeItem}>
                <Download size={10} color={macOSColors.semantic.success} />
                <Text style={styles.sizeLabel}>Received:</Text>
                <Text style={styles.sizeValue}>
                  {formatBytes(event.responseSize)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Request Headers - Collapsible */}
      <CollapsibleSection
        title="Request Headers"
        icon={<Upload size={14} color={macOSColors.semantic.info} />}
        defaultOpen={false}
      >
        {Object.keys(event.requestHeaders).length > 0 ? (
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.requestHeaders}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        ) : (
          <Text style={styles.emptyText}>No request headers</Text>
        )}
      </CollapsibleSection>

      {/* Response Headers - Collapsible */}
      <CollapsibleSection
        title="Response Headers"
        icon={<Download size={14} color={macOSColors.semantic.success} />}
        defaultOpen={false}
      >
        {Object.keys(event.responseHeaders).length > 0 ? (
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.responseHeaders}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        ) : (
          <Text style={styles.emptyText}>No response headers yet</Text>
        )}
      </CollapsibleSection>

      {/* Request Body - Collapsible */}
      {event.requestData ? (
        <CollapsibleSection
          title="Request Body"
          icon={<FileJson size={14} color={macOSColors.semantic.info} />}
          defaultOpen={false}
        >
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.requestData}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        </CollapsibleSection>
      ) : null}

      {/* Response Body - Collapsible */}
      {event.responseData ? (
        <CollapsibleSection
          title="Response Body"
          icon={<FileJson size={14} color={macOSColors.semantic.success} />}
          defaultOpen={false}
        >
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.responseData}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        </CollapsibleSection>
      ) : null}

      {/* Filter Options - Collapsible */}
      <CollapsibleSection
        title="Filter Options"
        icon={<Filter size={14} color={macOSColors.semantic.warning} />}
        defaultOpen={false}
      >
        <View style={styles.filterOptionsContainer}>
          {(() => {
            let domain = "";
            let urlPath = "";
            try {
              const url = new URL(event.url);
              domain = url.hostname;
              urlPath = url.pathname;
            } catch {
              urlPath = event.url;
            }

            const isDomainIgnored = ignoredPatterns.has(domain);
            const isUrlIgnored = ignoredPatterns.has(urlPath);

            return (
              <>
                {/* Domain Filter */}
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    isDomainIgnored && styles.filterOptionActive,
                  ]}
                  onPress={() => domain && onTogglePattern(domain)}
                >
                  <View style={styles.filterOptionLeft}>
                    <Globe
                      size={16}
                      color={
                        isDomainIgnored
                          ? macOSColors.semantic.warning
                          : macOSColors.text.muted
                      }
                    />
                    <View style={styles.filterOptionContent}>
                      <Text style={styles.filterOptionLabel}>
                        Ignore Domain
                      </Text>
                      <Text style={styles.filterOptionValue}>
                        {domain || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.filterToggle,
                      isDomainIgnored && styles.filterToggleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterToggleText,
                        isDomainIgnored && styles.filterToggleTextActive,
                      ]}
                    >
                      {isDomainIgnored ? "IGNORED" : "IGNORE"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* URL Filter */}
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    isUrlIgnored && styles.filterOptionActive,
                  ]}
                  onPress={() => urlPath && onTogglePattern(urlPath)}
                >
                  <View style={styles.filterOptionLeft}>
                    <Link
                      size={16}
                      color={
                        isUrlIgnored
                          ? macOSColors.semantic.warning
                          : macOSColors.text.muted
                      }
                    />
                    <View style={styles.filterOptionContent}>
                      <Text style={styles.filterOptionLabel}>
                        Ignore URL Pattern
                      </Text>
                      <Text style={styles.filterOptionValue} numberOfLines={1}>
                        {urlPath || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.filterToggle,
                      isUrlIgnored && styles.filterToggleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterToggleText,
                        isUrlIgnored && styles.filterToggleTextActive,
                      ]}
                    >
                      {isUrlIgnored ? "IGNORED" : "IGNORE"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Info Text */}
                <View style={styles.filterInfoBox}>
                  <Text style={styles.filterInfoText}>
                    Ignored requests will be hidden from the network list. You
                    can manage filters in the Filters tab.
                  </Text>
                </View>
              </>
            );
          })()}
        </View>
      </CollapsibleSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  // Request details section - always visible
  requestDetailsSection: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 12,
  },
  httpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  httpMethodBadge: {
    backgroundColor: macOSColors.semantic.infoBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  httpMethod: {
    color: macOSColors.semantic.info,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  httpStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  httpStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: macOSColors.semantic.warningBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingBadgeText: {
    color: macOSColors.semantic.warning,
    fontSize: 11,
    fontWeight: "600",
  },
  httpDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  httpDurationText: {
    color: macOSColors.text.secondary,
    fontSize: 11,
  },
  // URL breakdown styles
  urlBreakdown: {
    backgroundColor: macOSColors.background.input,
    borderRadius: 4,
    padding: 8,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  urlDomain: {
    color: macOSColors.text.primary,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  urlProtocol: {
    color: macOSColors.text.muted,
    fontSize: 10,
  },
  copyButton: {
    padding: 4,
  },
  urlPathRow: {
    paddingLeft: 18,
  },
  urlPath: {
    color: macOSColors.text.secondary,
    fontSize: 11,
    fontFamily: "monospace",
  },
  urlParams: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
  },
  urlParamsTitle: {
    color: macOSColors.text.secondary,
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  urlParam: {
    color: macOSColors.semantic.info,
    fontSize: 11,
    fontFamily: "monospace",
    marginLeft: 8,
    marginTop: 2,
  },
  // Timing section - always visible
  timingSection: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 12,
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timingLabel: {
    color: macOSColors.text.secondary,
    fontSize: 11,
  },
  timingValue: {
    color: macOSColors.text.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  timingExact: {
    color: macOSColors.text.muted,
    fontSize: 10,
    marginLeft: 4,
  },
  sizeRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
  },
  sizeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sizeLabel: {
    color: macOSColors.text.muted,
    fontSize: 10,
  },
  sizeValue: {
    color: macOSColors.semantic.info,
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  // Collapsible section styles
  collapsibleSection: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: macOSColors.background.hover,
  },
  collapsibleTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collapsibleTitleText: {
    color: macOSColors.text.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  collapsibleContent: {
    padding: 12,
  },
  // Data viewer container
  dataViewerContainer: {
    marginTop: -12,
    marginHorizontal: -12,
    marginBottom: -12,
  },
  // Error box
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: macOSColors.semantic.errorBackground,
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  errorText: {
    color: macOSColors.semantic.error,
    fontSize: 11,
    flex: 1,
  },
  // Empty state
  emptyText: {
    color: macOSColors.text.muted,
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  // Filter options styles
  filterOptionsContainer: {
    gap: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: macOSColors.background.hover,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  filterOptionActive: {
    backgroundColor: macOSColors.semantic.warningBackground,
    borderColor: macOSColors.semantic.warning + "33",
  },
  filterOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  filterOptionContent: {
    flex: 1,
  },
  filterOptionLabel: {
    color: macOSColors.text.secondary,
    fontSize: 11,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterOptionValue: {
    color: macOSColors.text.primary,
    fontSize: 13,
    fontFamily: "monospace",
  },
  filterToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: macOSColors.background.input,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  filterToggleActive: {
    backgroundColor: macOSColors.semantic.warning + "26",
    borderColor: macOSColors.semantic.warning + "4D",
  },
  filterToggleText: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.muted,
    letterSpacing: 0.5,
  },
  filterToggleTextActive: {
    color: macOSColors.semantic.warning,
  },
  filterInfoBox: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "33",
  },
  filterInfoText: {
    color: macOSColors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
  },
});
