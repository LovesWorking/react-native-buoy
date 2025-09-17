import { useState, useEffect, useRef, useCallback } from "react";
import {
  JsModal,
  type ModalMode,
} from "@/rn-better-dev-tools/src/components/modals/jsModal/JsModal";
import { ModalHeader } from "@/rn-better-dev-tools/src/shared/ui/components/ModalHeader";
import { useSafeAreaInsets } from "@/rn-better-dev-tools/src/shared/hooks/useSafeAreaInsets";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Database,
  Activity,
  Clock,
  Hash,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Filter,
} from "rn-better-dev-tools/icons";
import { AsyncStorageEvent } from "../utils/AsyncStorageListener";
import { formatRelativeTime } from "@/rn-better-dev-tools/src/shared/utils/time/formatRelativeTime";
import {
  InlineCopyButton,
  ToolbarCopyButton,
} from "@/rn-better-dev-tools/src/shared/ui/components";
import { DataViewer } from "../../react-query/components/shared/DataViewer";
import { devToolsStorageKeys } from "@/rn-better-dev-tools/src/shared/storage/devToolsStorageKeys";
import { parseValue } from "@/rn-better-dev-tools/src/shared/utils/valueFormatting";

interface StorageEventDetailModalProps {
  visible: boolean;
  event: AsyncStorageEvent | null;
  allEvents: AsyncStorageEvent[];
  onClose: () => void;
  onBack: () => void;
  enableSharedModalDimensions?: boolean;
  ignoredPatterns?: Set<string>;
  onTogglePattern?: (pattern: string) => void;
}

interface KeyStats {
  totalOperations: number;
  setCount: number;
  removeCount: number;
  mergeCount: number;
  firstSeen: Date;
  lastSeen: Date;
  latestEvent: AsyncStorageEvent | null;
  currentValue: unknown;
  history: {
    action: string;
    value: unknown;
    timestamp: Date;
  }[];
  valueChanges: {
    from: unknown;
    to: unknown;
    timestamp: Date;
  }[];
}

export function StorageEventDetailModal({
  visible,
  event,
  allEvents,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
  ignoredPatterns = new Set(),
  onTogglePattern = () => {},
}: StorageEventDetailModalProps) {
  const [keyStats, setKeyStats] = useState<KeyStats | null>(null);
  const [showValueChanges, setShowValueChanges] = useState(true);
  const [showOperationHistory, setShowOperationHistory] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();

  const handleModeChange = useCallback((mode: ModalMode) => {
    // Modal mode changed to: mode
  }, []);

  // Force re-render every 10 seconds for relative times
  const [, setTick] = useState(0);

  useEffect(() => {
    if (visible) {
      intervalRef.current = setInterval(() => {
        setTick((prev) => prev + 1);
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [visible]);

  // Calculate stats for the storage key
  useEffect(() => {
    if (!event?.data?.key || !visible) return;

    const key = event.data.key;

    // Get all events for this key
    const allKeyEvents = allEvents
      .filter((e) => e.data?.key === key)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (allKeyEvents.length === 0) return;

    // Build history and detect value changes
    const history: KeyStats["history"] = [];
    const valueChanges: KeyStats["valueChanges"] = [];
    let previousValue: unknown;
    let currentValue: unknown;

    allKeyEvents.forEach((e) => {
      const value = e.data?.value;

      history.push({
        action: e.action,
        value: value,
        timestamp: e.timestamp,
      });

      if (e.action === "setItem" || e.action === "mergeItem") {
        if (previousValue !== undefined && previousValue !== value) {
          valueChanges.push({
            from: previousValue,
            to: value,
            timestamp: e.timestamp,
          });
        }
        previousValue = value;
        currentValue = value;
      } else if (e.action === "removeItem") {
        if (previousValue !== undefined) {
          valueChanges.push({
            from: previousValue,
            to: null,
            timestamp: e.timestamp,
          });
        }
        previousValue = null;
        currentValue = null;
      }
    });

    const latestEvent = allKeyEvents[allKeyEvents.length - 1];

    const stats: KeyStats = {
      totalOperations: allKeyEvents.length,
      setCount: allKeyEvents.filter((e) => e.action === "setItem").length,
      removeCount: allKeyEvents.filter((e) => e.action === "removeItem").length,
      mergeCount: allKeyEvents.filter((e) => e.action === "mergeItem").length,
      firstSeen: allKeyEvents[0].timestamp,
      lastSeen: latestEvent.timestamp,
      latestEvent: latestEvent,
      currentValue: currentValue,
      history: history.reverse(), // Show most recent first
      valueChanges: valueChanges.reverse(),
    };

    setKeyStats(stats);
  }, [event, allEvents, visible]);


  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  const renderValueBadge = (value: unknown, showType: boolean = true) => {
    const parsed = parseValue(value);
    const type =
      parsed === null
        ? "null"
        : parsed === undefined
        ? "undefined"
        : typeof parsed;

    if (type === "boolean") {
      const isTrue = parsed === true;
      return (
        <View style={styles.booleanContainer}>
          <View
            style={[
              styles.booleanBadge,
              isTrue ? styles.trueBadge : styles.falseBadge,
            ]}
          >
            <Text
              style={[
                styles.booleanText,
                isTrue ? styles.trueText : styles.falseText,
              ]}
            >
              {isTrue ? "TRUE" : "FALSE"}
            </Text>
          </View>
        </View>
      );
    }

    if (
      type === "string" ||
      type === "number" ||
      type === "null" ||
      type === "undefined"
    ) {
      let displayValue = "";
      if (parsed === null) displayValue = "null";
      else if (parsed === undefined) displayValue = "undefined";
      else if (parsed === "") displayValue = "(empty string)";
      else if (type === "string") displayValue = `"${parsed}"`;
      else displayValue = String(parsed);

      return (
        <View style={styles.primitiveContainer}>
          <Text style={styles.primitiveValue}>{displayValue}</Text>
          {showType && type !== "null" && type !== "undefined" && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{type}</Text>
            </View>
          )}
        </View>
      );
    }

    return <DataViewer title="Value" data={parsed} showTypeFilter={false} />;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "setItem":
        return "#10B981";
      case "removeItem":
        return "#EF4444";
      case "mergeItem":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : `${devToolsStorageKeys.storage.eventsModal()}_detail`;

  const getAllData = () => {
    if (!keyStats) return null;

    return {
      key: event?.data?.key,
      currentValue: keyStats.currentValue,
      statistics: {
        totalOperations: keyStats.totalOperations,
        setCount: keyStats.setCount,
        removeCount: keyStats.removeCount,
        mergeCount: keyStats.mergeCount,
        firstSeen: keyStats.firstSeen.toISOString(),
        lastSeen: keyStats.lastSeen.toISOString(),
      },
      valueChanges: keyStats.valueChanges.map((change) => ({
        from: change.from,
        to: change.to,
        timestamp: change.timestamp.toISOString(),
      })),
      operationHistory: keyStats.history.map((item) => ({
        action: item.action,
        value: item.value,
        timestamp: item.timestamp.toISOString(),
      })),
    };
  };

  const getHistory = () => {
    if (!keyStats) return null;

    return keyStats.history.map((item) => ({
      action: item.action,
      value: item.value,
      timestamp: item.timestamp.toISOString(),
    }));
  };

  const getValueChanges = () => {
    if (!keyStats) return null;

    return keyStats.valueChanges.map((change) => ({
      from: change.from,
      to: change.to,
      timestamp: change.timestamp.toISOString(),
    }));
  };

  const renderHeaderContent = () => (
    <ModalHeader>
      <ModalHeader.Navigation onBack={onBack} />
      <ModalHeader.Content title="Key Overview" subtitle={event?.data?.key} />
      <ModalHeader.Actions onClose={onClose}>
        <ToolbarCopyButton
          value={getAllData()}
          buttonStyle={styles.copyButton}
          onCopySuccess={() =>
            Alert.alert("Copied", "All storage data copied to clipboard")
          }
          onCopyError={() =>
            Alert.alert("Error", "Failed to copy to clipboard")
          }
        />
      </ModalHeader.Actions>
    </ModalHeader>
  );

  if (!visible || !event) return null;

  const latestEvent = keyStats?.latestEvent || event;

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: renderHeaderContent(),
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        sentry-label="ignore storage event detail scroll"
      >
        {/* Latest Event Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={16} color="#10B981" />
            <Text style={styles.sectionTitle}>Latest Event</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Last Action</Text>
              <View
                style={[
                  styles.actionBadge,
                  {
                    backgroundColor: `${getActionColor(latestEvent.action)}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    { color: getActionColor(latestEvent.action) },
                  ]}
                >
                  {latestEvent.action}
                </Text>
              </View>
            </View>

            {latestEvent.data?.key && (
              <View style={styles.row}>
                <Text style={styles.label}>Key</Text>
                <Text style={styles.keyValue}>{latestEvent.data.key}</Text>
              </View>
            )}

            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>
                {formatTimestamp(latestEvent.timestamp)} (
                {formatRelativeTime(latestEvent.timestamp)})
              </Text>
            </View>
          </View>
        </View>

        {/* Current Value */}
        {keyStats?.currentValue !== undefined && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Hash size={16} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Current Value</Text>
            </View>
            <View style={styles.card}>
              {renderValueBadge(keyStats.currentValue)}
            </View>
          </View>
        )}

        {/* Key Statistics */}
        {keyStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={16} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Key Statistics</Text>
            </View>

            <View style={styles.breakdownList}>
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownItemRow}>
                  <View style={styles.breakdownItemLeft}>
                    <View
                      style={[
                        styles.breakdownIcon,
                        { backgroundColor: "rgba(255, 255, 255, 0.05)" },
                      ]}
                    >
                      <Database size={14} color="#E5E7EB" />
                    </View>
                    <View style={styles.breakdownItemInfo}>
                      <Text style={styles.breakdownItemLabel}>
                        Total Operations
                      </Text>
                      <Text style={styles.breakdownItemDesc}>
                        All storage operations
                      </Text>
                    </View>
                  </View>
                  <View style={styles.breakdownItemRight}>
                    <Text style={styles.breakdownCount}>
                      {keyStats.totalOperations}
                    </Text>
                  </View>
                </View>
              </View>

              {keyStats.setCount > 0 && (
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownItemRow}>
                    <View style={styles.breakdownItemLeft}>
                      <View
                        style={[
                          styles.breakdownIcon,
                          { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                        ]}
                      >
                        <CheckCircle size={14} color="#10B981" />
                      </View>
                      <View style={styles.breakdownItemInfo}>
                        <Text style={styles.breakdownItemLabel}>
                          Set Operations
                        </Text>
                        <Text style={styles.breakdownItemDesc}>
                          Value assignments
                        </Text>
                      </View>
                    </View>
                    <View style={styles.breakdownItemRight}>
                      <Text
                        style={[styles.breakdownCount, { color: "#10B981" }]}
                      >
                        {keyStats.setCount}
                      </Text>
                      <Text style={styles.breakdownPercentage}>
                        {(
                          (keyStats.setCount / keyStats.totalOperations) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {keyStats.removeCount > 0 && (
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownItemRow}>
                    <View style={styles.breakdownItemLeft}>
                      <View
                        style={[
                          styles.breakdownIcon,
                          { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                        ]}
                      >
                        <XCircle size={14} color="#EF4444" />
                      </View>
                      <View style={styles.breakdownItemInfo}>
                        <Text style={styles.breakdownItemLabel}>
                          Remove Operations
                        </Text>
                        <Text style={styles.breakdownItemDesc}>
                          Key deletions
                        </Text>
                      </View>
                    </View>
                    <View style={styles.breakdownItemRight}>
                      <Text
                        style={[styles.breakdownCount, { color: "#EF4444" }]}
                      >
                        {keyStats.removeCount}
                      </Text>
                      <Text style={styles.breakdownPercentage}>
                        {(
                          (keyStats.removeCount / keyStats.totalOperations) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {keyStats.mergeCount > 0 && (
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownItemRow}>
                    <View style={styles.breakdownItemLeft}>
                      <View
                        style={[
                          styles.breakdownIcon,
                          { backgroundColor: "rgba(59, 130, 246, 0.1)" },
                        ]}
                      >
                        <Activity size={14} color="#3B82F6" />
                      </View>
                      <View style={styles.breakdownItemInfo}>
                        <Text style={styles.breakdownItemLabel}>
                          Merge Operations
                        </Text>
                        <Text style={styles.breakdownItemDesc}>
                          Object merges
                        </Text>
                      </View>
                    </View>
                    <View style={styles.breakdownItemRight}>
                      <Text
                        style={[styles.breakdownCount, { color: "#3B82F6" }]}
                      >
                        {keyStats.mergeCount}
                      </Text>
                      <Text style={styles.breakdownPercentage}>
                        {(
                          (keyStats.mergeCount / keyStats.totalOperations) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>First Seen</Text>
                <Text style={styles.value}>
                  {formatTimestamp(keyStats.firstSeen)} (
                  {formatRelativeTime(keyStats.firstSeen)})
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Last Updated</Text>
                <Text style={styles.value}>
                  {formatTimestamp(keyStats.lastSeen)} (
                  {formatRelativeTime(keyStats.lastSeen)})
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Value Change History */}
        {keyStats && keyStats.valueChanges.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowValueChanges(!showValueChanges)}
              activeOpacity={0.7}
              sentry-label="ignore toggle value changes"
            >
              <View style={styles.sectionHeader}>
                <Activity size={16} color="#F59E0B" />
                <Text style={styles.sectionTitle}>
                  Value Changes ({keyStats.valueChanges.length})
                </Text>
              </View>
              <View style={styles.headerActions}>
                <InlineCopyButton
                  value={getValueChanges()}
                  buttonStyle={styles.copyButton}
                  onCopySuccess={() =>
                    Alert.alert("Copied", "Value changes copied to clipboard")
                  }
                  onCopyError={() =>
                    Alert.alert("Error", "Failed to copy to clipboard")
                  }
                />
                {showValueChanges ? (
                  <ChevronUp size={16} color="#6B7280" />
                ) : (
                  <ChevronDown size={16} color="#6B7280" />
                )}
              </View>
            </TouchableOpacity>

            {showValueChanges && (
              <ScrollView
                style={styles.scrollableCard}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                sentry-label="ignore value changes scroll"
              >
                {keyStats.valueChanges.map((change, index) => (
                  <View key={index} style={styles.changeItem}>
                    <Text style={styles.changeTime}>
                      {formatTimestamp(change.timestamp)}
                    </Text>
                    <View style={styles.changeFlow}>
                      <View style={styles.changeValueContainer}>
                        {renderValueBadge(change.from, false)}
                      </View>
                      <Text style={styles.changeArrow}>→</Text>
                      <View style={styles.changeValueContainer}>
                        {renderValueBadge(change.to, false)}
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Operation History */}
        {keyStats && keyStats.history.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowOperationHistory(!showOperationHistory)}
              activeOpacity={0.7}
              sentry-label="ignore toggle operation history"
            >
              <View style={styles.sectionHeader}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.sectionTitle}>
                  Operation History ({keyStats.history.length})
                </Text>
              </View>
              <View style={styles.headerActions}>
                <InlineCopyButton
                  value={getHistory()}
                  buttonStyle={styles.copyButton}
                  onCopySuccess={() =>
                    Alert.alert(
                      "Copied",
                      "Operation history copied to clipboard"
                    )
                  }
                  onCopyError={() =>
                    Alert.alert("Error", "Failed to copy to clipboard")
                  }
                />
                {showOperationHistory ? (
                  <ChevronUp size={16} color="#6B7280" />
                ) : (
                  <ChevronDown size={16} color="#6B7280" />
                )}
              </View>
            </TouchableOpacity>

            {showOperationHistory && (
              <ScrollView
                style={styles.scrollableCard}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                sentry-label="ignore operation history scroll"
              >
                {keyStats.history.slice(0, 50).map((item, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyTime}>
                        {formatTimestamp(item.timestamp)}
                      </Text>
                      <View
                        style={[
                          styles.historyBadge,
                          {
                            backgroundColor: `${getActionColor(item.action)}20`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyAction,
                            { color: getActionColor(item.action) },
                          ]}
                        >
                          {item.action}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyValueContainer}>
                      {item.value !== undefined &&
                        (typeof parseValue(item.value) === "object" &&
                        parseValue(item.value) !== null ? (
                          <Text style={styles.historyObjectValue}>
                            [Object]
                          </Text>
                        ) : (
                          renderValueBadge(item.value, false)
                        ))}
                    </View>
                  </View>
                ))}
                {keyStats.history.length > 50 && (
                  <Text style={styles.moreText}>
                    ... and {keyStats.history.length - 50} more operations
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Filter Button */}
        {event?.data?.key &&
          (() => {
            const key = event.data.key;
            const isKeyIgnored = Array.from(ignoredPatterns).some((pattern) =>
              key.includes(pattern)
            );

            return (
              <View
                style={[
                  styles.filterSection,
                  { paddingBottom: Math.max(insets.bottom, 16) },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    isKeyIgnored && styles.filterButtonActive,
                  ]}
                  onPress={() => onTogglePattern(key)}
                  activeOpacity={0.7}
                  sentry-label="ignore toggle key filter"
                >
                  <Filter
                    size={14}
                    color={isKeyIgnored ? "#F59E0B" : "#3B82F6"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      isKeyIgnored && styles.filterButtonTextActive,
                    ]}
                  >
                    {isKeyIgnored
                      ? "Stop Ignoring This Key"
                      : "Ignore Events from This Key"}
                  </Text>
                </TouchableOpacity>
                {!isKeyIgnored && (
                  <Text style={styles.filterHintText}>
                    Events from this key will be hidden from the list
                  </Text>
                )}
              </View>
            );
          })()}
      </ScrollView>
    </JsModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  copyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  liveIndicator: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 9,
    color: "#10B981",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  scrollableCard: {
    maxHeight: 200,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    color: "#6B7280",
    fontSize: 12,
  },
  value: {
    color: "#E5E7EB",
    fontSize: 12,
    fontFamily: "monospace",
  },
  keyValue: {
    color: "#3B82F6",
    fontSize: 12,
    fontFamily: "monospace",
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  booleanContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  booleanBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trueBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  falseBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  booleanText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  trueText: {
    color: "#10B981",
  },
  falseText: {
    color: "#EF4444",
  },
  typeBadge: {
    backgroundColor: "rgba(107, 114, 128, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  primitiveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primitiveValue: {
    fontSize: 13,
    color: "#3B82F6",
    fontFamily: "monospace",
    fontWeight: "500",
  },
  breakdownList: {
    paddingHorizontal: 16,
    gap: 1,
  },
  breakdownItem: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    marginBottom: 6,
  },
  breakdownItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  breakdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  breakdownItemInfo: {
    flex: 1,
  },
  breakdownItemLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#E5E7EB",
    marginBottom: 2,
  },
  breakdownItemDesc: {
    fontSize: 11,
    color: "#6B7280",
  },
  breakdownItemRight: {
    alignItems: "flex-end",
  },
  breakdownCount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  breakdownPercentage: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  changeItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  changeTime: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "monospace",
    marginBottom: 6,
  },
  changeFlow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeValueContainer: {
    flex: 1,
  },
  changeArrow: {
    fontSize: 14,
    color: "#6B7280",
    paddingHorizontal: 4,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    gap: 8,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  historyTime: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "monospace",
    minWidth: 80,
  },
  historyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  historyAction: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  historyValueContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  moreText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  historyObjectValue: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    fontFamily: "monospace",
  },

  // Filter Button
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    marginTop: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.15)",
  },
  filterButtonActive: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.15)",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
    letterSpacing: 0.3,
  },
  filterButtonTextActive: {
    color: "#F59E0B",
  },
  filterHintText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});
