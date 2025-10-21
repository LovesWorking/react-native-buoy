import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageEvent } from "../utils/AsyncStorageListener";
import {
  formatRelativeTime,
  macOSColors,
  parseValue,
  devToolsStorageKeys,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Database,
  GitBranch,
} from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";
import { ThemedSplitView } from "./DiffViewer/modes/ThemedSplitView";
import { diffThemes } from "./DiffViewer/themes/diffThemes";
import { computeLineDiff, DiffType } from "../utils/lineDiff";
import { TreeDiffViewer } from "./DiffViewer/TreeDiffViewer";
import { translateStorageAction } from "../utils/storageActionHelpers";

interface StorageKeyConversation {
  key: string;
  lastEvent: AsyncStorageEvent;
  events: AsyncStorageEvent[];
  totalOperations: number;
  currentValue: unknown;
  valueType:
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "undefined"
    | "object"
    | "array";
}

interface StorageEventDetailContentProps {
  conversation: StorageKeyConversation;
  selectedEventIndex?: number;
  onEventIndexChange?: (index: number) => void;
  // If true, do not render the internal sticky footer (use external modal footer)
  disableInternalFooter?: boolean;
}

export function StorageEventDetailContent({
  conversation,
  selectedEventIndex = 0,
  onEventIndexChange = () => {},
  disableInternalFooter = false,
}: StorageEventDetailContentProps) {
  // Internal view state - now managed internally instead of via props
  const [internalActiveView, setInternalActiveView] = useState<
    "current" | "diff"
  >("current");
  // Compare-any-two state for Diff tab
  const [leftIndex, setLeftIndex] = useState<number>(
    Math.max(0, selectedEventIndex - 1)
  );
  const [rightIndex, setRightIndex] = useState<number>(selectedEventIndex);
  const [isLeftPickerOpen, setIsLeftPickerOpen] = useState(false);
  const [isRightPickerOpen, setIsRightPickerOpen] = useState(false);
  const [diffViewerTab, setDiffViewerTab] = useState<"split" | "tree">("tree");

  // Track if preferences have been loaded
  const hasLoadedPreferences = useRef(false);

  // Load saved preferences on mount
  useEffect(() => {
    if (hasLoadedPreferences.current) return;

    const loadPreferences = async () => {
      try {

        // Load detail view preference (current/diff)
        const savedDetailView = await AsyncStorage.getItem(
          devToolsStorageKeys.storage.detailView()
        );
        if (savedDetailView === "current" || savedDetailView === "diff") {
          setInternalActiveView(savedDetailView);
        }

        // Load diff viewer mode preference (split/tree)
        const savedDiffMode = await AsyncStorage.getItem(
          devToolsStorageKeys.storage.diffViewerMode()
        );
        if (savedDiffMode === "split" || savedDiffMode === "tree") {
          setDiffViewerTab(savedDiffMode);
        }

        hasLoadedPreferences.current = true;
      } catch (error) {
        console.warn("Failed to load view preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Save detail view preference when changed
  const handleViewChange = useCallback(async (view: "current" | "diff") => {
    setInternalActiveView(view);
    try {
      await AsyncStorage.setItem(
        devToolsStorageKeys.storage.detailView(),
        view
      );
    } catch (error) {
      console.warn("Failed to save detail view preference:", error);
    }
  }, []);

  // Save diff viewer mode preference when changed
  const handleDiffModeChange = useCallback(async (mode: "split" | "tree") => {
    setDiffViewerTab(mode);
    try {
      await AsyncStorage.setItem(
        devToolsStorageKeys.storage.diffViewerMode(),
        mode
      );
    } catch (error) {
      console.warn("Failed to save diff viewer mode preference:", error);
    }
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case "setItem":
      case "multiSet":
        return macOSColors.semantic.success;
      case "removeItem":
      case "multiRemove":
      case "clear":
        return macOSColors.semantic.error;
      case "mergeItem":
      case "multiMerge":
        return macOSColors.semantic.info;
      default:
        return macOSColors.text.muted;
    }
  };

  const renderValueContent = (
    value: unknown,
    label: string,
    action?: string
  ) => {
    const parsed = parseValue(value);
    const type =
      parsed === null
        ? "null"
        : parsed === undefined
        ? "undefined"
        : Array.isArray(parsed)
        ? "array"
        : typeof parsed;

    return (
      <View style={styles.valueContent}>
        <View style={styles.valueHeader}>
          <Text style={styles.valueLabel}>{label}</Text>
          <View style={styles.valueHeaderBadges}>
            {action && (
              <View
                style={[
                  styles.actionBadge,
                  { backgroundColor: `${getActionColor(action)}20` },
                ]}
              >
                <Text
                  style={[styles.actionText, { color: getActionColor(action) }]}
                >
                  {translateStorageAction(action)}
                </Text>
              </View>
            )}
            <View style={[styles.typeBadge]}>
              <Text style={styles.typeText}>{type.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.valueBox}>
          {type === "object" || type === "array" ? (
            parsed &&
            ((Array.isArray(parsed) && parsed.length > 0) ||
              (typeof parsed === "object" &&
                Object.keys(parsed).length > 0)) ? (
              <DataViewer title="" data={parsed} showTypeFilter={false} />
            ) : (
              <Text style={styles.valueText}>
                {type === "array" ? "[]" : "{}"}
              </Text>
            )
          ) : (
            <Text style={styles.valueText}>
              {parsed === null
                ? "null"
                : parsed === undefined
                ? "undefined"
                : type === "string"
                ? `"${parsed}"`
                : String(parsed)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Get all events sorted by time
  const navigationItems = conversation.events.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const totalEvents = navigationItems.length;

  // Keep compare indices synced to selection
  useEffect(() => {
    const newRight = Math.min(totalEvents - 1, Math.max(0, selectedEventIndex));
    const newLeft = Math.max(0, Math.min(newRight - 1, selectedEventIndex - 1));
    setLeftIndex(newLeft);
    setRightIndex(newRight);
  }, [selectedEventIndex, totalEvents]);

  // Precise time HH:MM:SS.mmm
  const formatTimeWithMs = useCallback((date: Date): string => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    const ms = String(date.getMilliseconds()).padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  }, []);

  const bumpLeft = (delta: number) => {
    if (totalEvents < 2) return;
    let next = Math.max(0, Math.min(totalEvents - 2, leftIndex + delta));
    if (next >= rightIndex) next = Math.max(0, rightIndex - 1);
    setLeftIndex(next);
  };

  const bumpRight = (delta: number) => {
    if (totalEvents < 2) return;
    let next = Math.max(1, Math.min(totalEvents - 1, rightIndex + delta));
    if (next <= leftIndex) next = Math.min(totalEvents - 1, leftIndex + 1);
    setRightIndex(next);
  };

  // Render current value tab
  const renderCurrentValue = () => {
    const selectedEvent = navigationItems[selectedEventIndex];
    const valueToShow = selectedEvent?.data?.value ?? conversation.currentValue;
    const action = selectedEvent?.action;

    return (
      <View style={styles.fullPageSection}>
        <View style={styles.contentCard}>
          {renderValueContent(valueToShow, "CURRENT VALUE", action)}
        </View>
      </View>
    );
  };

  // Render diff tab
  const renderDiff = () => {
    if (navigationItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <AlertCircle size={32} color={macOSColors.text.muted} />
          <Text style={styles.emptyText}>No changes to display</Text>
        </View>
      );
    }

    const leftEvent =
      navigationItems[Math.max(0, Math.min(totalEvents - 1, leftIndex))];
    const rightEvent =
      navigationItems[Math.max(0, Math.min(totalEvents - 1, rightIndex))];
    const previousValue = leftEvent?.data?.value ?? null;
    const currentValue = rightEvent?.data?.value;

    return (
      <View style={styles.fullPageSection}>
        {/* Diff Viewer Tabs */}
        <View style={styles.diffViewerTabs}>
          <TouchableOpacity
            style={[
              styles.diffViewerTab,
              diffViewerTab === "split" && styles.diffViewerTabActive,
            ]}
            onPress={() => handleDiffModeChange("split")}
          >
            <Text
              style={[
                styles.diffViewerTabText,
                diffViewerTab === "split" && styles.diffViewerTabTextActive,
              ]}
            >
              SPLIT VIEW
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.diffViewerTab,
              diffViewerTab === "tree" && styles.diffViewerTabActive,
            ]}
            onPress={() => handleDiffModeChange("tree")}
          >
            <Text
              style={[
                styles.diffViewerTabText,
                diffViewerTab === "tree" && styles.diffViewerTabTextActive,
              ]}
            >
              TREE VIEW
            </Text>
          </TouchableOpacity>
        </View>

        {/* Compare picker row */}
        {totalEvents > 0 && (
          <View style={styles.compareBar}>
            {/* PREV side */}
            <View style={styles.compareSide}>
              <View style={styles.compareLabelRow}>
                <Text
                  style={[
                    styles.compareLabel,
                    { color: macOSColors.semantic.debug },
                  ]}
                >
                  PREV
                </Text>
                <View
                  style={[
                    styles.compareActionBadge,
                    {
                      backgroundColor: `${getActionColor(leftEvent.action)}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.compareActionText,
                      { color: getActionColor(leftEvent.action) },
                    ]}
                  >
                    {translateStorageAction(leftEvent.action)}
                  </Text>
                </View>
              </View>
              <View style={styles.compareControls}>
                <TouchableOpacity
                  onPress={() => bumpLeft(-1)}
                  disabled={leftIndex <= 0}
                  style={[
                    styles.compareBtn,
                    leftIndex <= 0 && styles.compareBtnDisabled,
                  ]}
                >
                  <ChevronLeft
                    size={14}
                    color={
                      leftIndex <= 0
                        ? macOSColors.text.muted
                        : macOSColors.text.secondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.compareMeta}
                  onPress={() => setIsLeftPickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.compareIndex}>
                    #{leftIndex + 1} / {totalEvents}
                  </Text>
                  <Text style={styles.compareTime}>
                    {formatTimeWithMs(leftEvent.timestamp)}
                  </Text>
                  <Text style={styles.compareRelative}>
                    ({formatRelativeTime(leftEvent.timestamp)})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => bumpLeft(1)}
                  disabled={leftIndex >= rightIndex - 1}
                  style={[
                    styles.compareBtn,
                    leftIndex >= rightIndex - 1 && styles.compareBtnDisabled,
                  ]}
                >
                  <ChevronRight
                    size={14}
                    color={
                      leftIndex >= rightIndex - 1
                        ? macOSColors.text.muted
                        : macOSColors.text.secondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.compareDivider} />

            {/* CUR side */}
            <View style={styles.compareSide}>
              <View style={styles.compareLabelRow}>
                <Text
                  style={[
                    styles.compareLabel,
                    { color: macOSColors.semantic.success },
                  ]}
                >
                  CUR
                </Text>
                <View
                  style={[
                    styles.compareActionBadge,
                    {
                      backgroundColor: `${getActionColor(rightEvent.action)}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.compareActionText,
                      { color: getActionColor(rightEvent.action) },
                    ]}
                  >
                    {translateStorageAction(rightEvent.action)}
                  </Text>
                </View>
              </View>
              <View style={styles.compareControls}>
                <TouchableOpacity
                  onPress={() => bumpRight(-1)}
                  disabled={rightIndex <= leftIndex + 1}
                  style={[
                    styles.compareBtn,
                    rightIndex <= leftIndex + 1 && styles.compareBtnDisabled,
                  ]}
                >
                  <ChevronLeft
                    size={14}
                    color={
                      rightIndex <= leftIndex + 1
                        ? macOSColors.text.muted
                        : macOSColors.text.secondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.compareMeta}
                  onPress={() => setIsRightPickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.compareIndex}>
                    #{rightIndex + 1} / {totalEvents}
                  </Text>
                  <Text style={styles.compareTime}>
                    {formatTimeWithMs(rightEvent.timestamp)}
                  </Text>
                  <Text style={styles.compareRelative}>
                    ({formatRelativeTime(rightEvent.timestamp)})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => bumpRight(1)}
                  disabled={rightIndex >= totalEvents - 1}
                  style={[
                    styles.compareBtn,
                    rightIndex >= totalEvents - 1 && styles.compareBtnDisabled,
                  ]}
                >
                  <ChevronRight
                    size={14}
                    color={
                      rightIndex >= totalEvents - 1
                        ? macOSColors.text.muted
                        : macOSColors.text.secondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {diffViewerTab === "split" && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
            <ThemedSplitView
              oldValue={parseValue(previousValue)}
              newValue={parseValue(currentValue)}
              differences={[]}
              theme={diffThemes.devToolsDefault}
              options={{
                hideLineNumbers: false,
                disableWordDiff: false,
                showDiffOnly: false,
                compareMethod: "words",
                contextLines: 3,
                lineOffset: 0,
              }}
              showThemeName={false}
            />
          </ScrollView>
        )}

        {diffViewerTab === "tree" && (
          <TreeDiffViewer
            oldValue={parseValue(previousValue)}
            newValue={parseValue(currentValue)}
          />
        )}
      </View>
    );
  };

  return (
    <>
      <View
        style={[
          styles.contentOnly,
          {
            flex: 1,
            paddingBottom: !disableInternalFooter && totalEvents > 1 ? 80 : 0,
          },
        ]}
      >
        {/* Toggle Cards for View Selection */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleCard,
              internalActiveView === "current" && styles.viewToggleCardActive,
            ]}
            onPress={() => handleViewChange("current")}
            activeOpacity={0.8}
          >
            <View style={styles.viewToggleContent}>
              <Database
                size={16}
                color={
                  internalActiveView === "current"
                    ? macOSColors.semantic.info
                    : macOSColors.text.secondary
                }
              />
              <Text
                style={[
                  styles.viewToggleLabel,
                  internalActiveView === "current" &&
                    styles.viewToggleLabelActive,
                ]}
              >
                CURRENT VALUE
              </Text>
            </View>
            <Text
              style={[
                styles.viewToggleDescription,
                internalActiveView === "current" && {
                  color: macOSColors.text.primary,
                },
              ]}
            >
              View the current stored value
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewToggleCard,
              internalActiveView === "diff" && styles.viewToggleCardActive,
            ]}
            onPress={() => handleViewChange("diff")}
            activeOpacity={0.8}
          >
            <View style={styles.viewToggleContent}>
              <GitBranch
                size={16}
                color={
                  internalActiveView === "diff"
                    ? macOSColors.semantic.success
                    : macOSColors.text.secondary
                }
              />
              <Text
                style={[
                  styles.viewToggleLabel,
                  internalActiveView === "diff" && styles.viewToggleLabelActive,
                ]}
              >
                DIFF VIEW
              </Text>
            </View>
            <Text
              style={[
                styles.viewToggleDescription,
                internalActiveView === "diff" && {
                  color: macOSColors.text.primary,
                },
              ]}
            >
              Compare changes between versions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected view */}
        {internalActiveView === "current" && renderCurrentValue()}
        {internalActiveView === "diff" && renderDiff()}
      </View>

      {(isLeftPickerOpen || isRightPickerOpen) && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => {
              setIsLeftPickerOpen(false);
              setIsRightPickerOpen(false);
            }}
          />
          <View
            style={[
              styles.pickerCard,
              isLeftPickerOpen && styles.pickerCardLeft,
              isRightPickerOpen && styles.pickerCardRight,
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  isLeftPickerOpen && styles.pickerTitleLeft,
                  isRightPickerOpen && styles.pickerTitleRight,
                ]}
              >
                Select {isLeftPickerOpen ? "PREV" : "CUR"} Event
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLeftPickerOpen(false);
                  setIsRightPickerOpen(false);
                }}
                style={styles.pickerClose}
                accessibilityLabel="Close event picker"
              >
                <X size={16} color={macOSColors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerDivider} />

            <ScrollView
              style={styles.pickerScroll}
              contentContainerStyle={styles.pickerList}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {navigationItems.map((item, idx) => {
                const disabled = isLeftPickerOpen
                  ? idx >= rightIndex
                  : idx <= leftIndex;
                const isSelected = isLeftPickerOpen
                  ? idx === leftIndex
                  : idx === rightIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={disabled}
                    onPress={() => {
                      if (isLeftPickerOpen) {
                        setLeftIndex(Math.min(idx, rightIndex - 1));
                        setIsLeftPickerOpen(false);
                      } else {
                        setRightIndex(Math.max(idx, leftIndex + 1));
                        setIsRightPickerOpen(false);
                      }
                    }}
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                      isSelected &&
                        isLeftPickerOpen &&
                        styles.pickerItemSelectedLeft,
                      isSelected &&
                        isRightPickerOpen &&
                        styles.pickerItemSelectedRight,
                      disabled && styles.pickerItemDisabled,
                    ]}
                  >
                    <Text style={styles.pickerIndex}>#{idx + 1}</Text>
                    <Text style={styles.pickerTime}>
                      {formatTimeWithMs(item.timestamp)}
                    </Text>
                    <Text style={styles.pickerRelative}>
                      ({formatRelativeTime(item.timestamp)})
                    </Text>
                    {(() => {
                      const targetOld = isLeftPickerOpen
                        ? item
                        : navigationItems[leftIndex];
                      const targetNew = isLeftPickerOpen
                        ? navigationItems[rightIndex]
                        : item;
                      const oldVal = parseValue(targetOld.data?.value);
                      const newVal = parseValue(targetNew.data?.value);
                      const diffs = computeLineDiff(oldVal, newVal, {
                        compareMethod: "words",
                        disableWordDiff: false,
                        showDiffOnly: false,
                        contextLines: 0,
                      });
                      const added = diffs.filter(
                        (d) => d.type === DiffType.ADDED
                      ).length;
                      const removed = diffs.filter(
                        (d) => d.type === DiffType.REMOVED
                      ).length;
                      const modified = diffs.filter(
                        (d) => d.type === DiffType.MODIFIED
                      ).length;
                      return (
                        <View style={styles.pickerCounts}>
                          <Text
                            style={[
                              styles.pickerCountText,
                              {
                                color:
                                  diffThemes.devToolsDefault.summaryAddedText,
                              },
                            ]}
                          >
                            +{added}
                          </Text>
                          <Text
                            style={[
                              styles.pickerCountText,
                              {
                                color:
                                  diffThemes.devToolsDefault.summaryRemovedText,
                              },
                            ]}
                          >
                            -{removed}
                          </Text>
                          <Text
                            style={[
                              styles.pickerCountText,
                              {
                                color:
                                  diffThemes.devToolsDefault
                                    .summaryModifiedText,
                              },
                            ]}
                          >
                            ~{modified}
                          </Text>
                        </View>
                      );
                    })()}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Bottom Navigation - Fixed at bottom */}
      {totalEvents > 1 && !disableInternalFooter && (
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            onPress={() =>
              onEventIndexChange(Math.max(0, selectedEventIndex - 1))
            }
            disabled={selectedEventIndex === 0}
            style={[
              styles.navButton,
              selectedEventIndex === 0 && styles.navButtonDisabled,
            ]}
          >
            <ChevronLeft
              size={20}
              color={
                selectedEventIndex === 0
                  ? macOSColors.text.muted
                  : macOSColors.text.primary
              }
            />
            <Text
              style={[
                styles.navButtonText,
                selectedEventIndex === 0 && styles.navButtonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.eventCounterContainer}>
            <Text style={styles.eventCounter}>
              Event {selectedEventIndex + 1} of {totalEvents}
            </Text>
            <Text style={styles.eventTimestamp}>
              {formatRelativeTime(
                navigationItems[selectedEventIndex]?.timestamp
              )}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              onEventIndexChange(
                Math.min(totalEvents - 1, selectedEventIndex + 1)
              )
            }
            disabled={selectedEventIndex === totalEvents - 1}
            style={[
              styles.navButton,
              selectedEventIndex === totalEvents - 1 &&
                styles.navButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.navButtonText,
                selectedEventIndex === totalEvents - 1 &&
                  styles.navButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <ChevronRight
              size={20}
              color={
                selectedEventIndex === totalEvents - 1
                  ? macOSColors.text.muted
                  : macOSColors.text.primary
              }
            />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// External footer component to be rendered by the modal outside the ScrollView
export function StorageEventDetailFooter({
  conversation,
  selectedEventIndex = 0,
  onEventIndexChange = () => {},
}: {
  conversation: StorageKeyConversation;
  selectedEventIndex?: number;
  onEventIndexChange?: (index: number) => void;
}) {
  const navigationItems = conversation.events.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const totalEvents = navigationItems.length;

  if (totalEvents <= 1) return null;

  return (
    <View style={styles.externalFooterBar}>
      <TouchableOpacity
        onPress={() => onEventIndexChange(Math.max(0, selectedEventIndex - 1))}
        disabled={selectedEventIndex === 0}
        style={[
          styles.navButton,
          selectedEventIndex === 0 && styles.navButtonDisabled,
        ]}
      >
        <ChevronLeft
          size={20}
          color={
            selectedEventIndex === 0
              ? macOSColors.text.muted
              : macOSColors.text.primary
          }
        />
        <Text
          style={[
            styles.navButtonText,
            selectedEventIndex === 0 && styles.navButtonTextDisabled,
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.eventCounterContainer}>
        <Text style={styles.eventCounter}>
          Event {selectedEventIndex + 1} of {totalEvents}
        </Text>
        <Text style={styles.eventTimestamp}>
          {formatRelativeTime(navigationItems[selectedEventIndex]?.timestamp)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          onEventIndexChange(Math.min(totalEvents - 1, selectedEventIndex + 1))
        }
        disabled={selectedEventIndex === totalEvents - 1}
        style={[
          styles.navButton,
          selectedEventIndex === totalEvents - 1 && styles.navButtonDisabled,
        ]}
      >
        <Text
          style={[
            styles.navButtonText,
            selectedEventIndex === totalEvents - 1 &&
              styles.navButtonTextDisabled,
          ]}
        >
          Next
        </Text>
        <ChevronRight
          size={20}
          color={
            selectedEventIndex === totalEvents - 1
              ? macOSColors.text.muted
              : macOSColors.text.primary
          }
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contentOnly: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: macOSColors.background.base,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  // Same styling as stickyFooter but without absolute positioning.
  externalFooterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: macOSColors.background.base,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fullPageSection: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  card: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  valueContent: {
    marginTop: 4,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  valueHeaderBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: macOSColors.background.input,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "600",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
  valueBox: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.input,
    padding: 8,
  },
  valueText: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    minWidth: 100,
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  navButtonTextDisabled: {
    color: macOSColors.text.muted,
  },
  eventCounterContainer: {
    alignItems: "center",
  },
  eventCounter: {
    fontSize: 14,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  eventTimestamp: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginTop: 2,
  },
  // Compare picker styles
  compareBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 8,
  },
  compareSide: {
    flex: 1,
  },
  compareLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  compareLabel: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  compareActionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  compareActionText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  compareControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compareBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  compareBtnDisabled: {
    opacity: 0.4,
  },
  compareMeta: {
    flex: 1,
  },
  compareTime: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  compareIndex: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  compareRelative: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  compareDivider: {
    width: 1,
    height: 34,
    backgroundColor: macOSColors.background.input,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  pickerCard: {
    width: "86%",
    maxHeight: 320,
    backgroundColor: macOSColors.background.card,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 15,
  },
  pickerCardLeft: {
    borderColor: macOSColors.semantic.debug,
    shadowColor: macOSColors.semantic.debug,
  },
  pickerCardRight: {
    borderColor: macOSColors.semantic.success,
    shadowColor: macOSColors.semantic.success,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerClose: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  pickerDivider: {
    height: 1,
    backgroundColor: macOSColors.background.input,
    marginVertical: 8,
  },
  pickerScroll: {
    maxHeight: 260,
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  pickerTitleLeft: {
    color: macOSColors.semantic.debug,
  },
  pickerTitleRight: {
    color: macOSColors.semantic.success,
  },
  pickerList: {
    gap: 4,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: macOSColors.background.base,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pickerItemSelected: {
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  pickerItemSelectedLeft: {
    backgroundColor: macOSColors.semantic.debug + "1A",
    borderColor: macOSColors.semantic.debug,
    shadowColor: macOSColors.semantic.debug,
  },
  pickerItemSelectedRight: {
    backgroundColor: macOSColors.semantic.successBackground + "30",
    borderColor: macOSColors.semantic.success,
    shadowColor: macOSColors.semantic.success,
  },
  pickerItemDisabled: {
    opacity: 0.4,
  },
  pickerIndex: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    width: 40,
  },
  pickerTime: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },
  pickerRelative: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  pickerCounts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  pickerCountText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  diffViewerTabs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 8,
    gap: 4,
  },
  diffViewerTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  diffViewerTabActive: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "40",
  },
  diffViewerTabText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
    color: macOSColors.text.secondary,
    letterSpacing: 0.5,
  },
  diffViewerTabTextActive: {
    color: macOSColors.text.primary,
  },
  contentCard: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },

  // View Toggle Cards
  viewToggleContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: macOSColors.background.base,
  },
  viewToggleCard: {
    flex: 1,
    backgroundColor: macOSColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 14,
    gap: 8,
  },
  viewToggleCardActive: {
    borderWidth: 1.5,
    borderColor: macOSColors.semantic.info,
    backgroundColor: macOSColors.semantic.infoBackground + "30",
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewToggleLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: macOSColors.text.secondary,
    textTransform: "uppercase",
  },
  viewToggleLabelActive: {
    color: macOSColors.text.primary,
  },
  viewToggleDescription: {
    fontSize: 11,
    color: macOSColors.text.muted,
    lineHeight: 16,
  },
});
