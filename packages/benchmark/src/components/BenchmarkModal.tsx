/**
 * BenchmarkModal
 *
 * Main modal component for the Benchmark dev tool.
 * Provides recording controls, session list, detail views, and comparison.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  JsModal,
  ModalHeader,
  macOSColors,
  devToolsStorageKeys,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  GitBranch,
  Edit3,
  Copy,
  copyToClipboard,
} from "@react-buoy/shared-ui";
import {
  benchmarkRecorder,
  BenchmarkStorage,
  BenchmarkComparator,
  createAsyncStorageAdapter,
} from "../benchmarking";
import type { BenchmarkMetadata, BenchmarkReport } from "../benchmarking";
import { BenchmarkSessionCard } from "./BenchmarkSessionCard";
import { BenchmarkDetailView } from "./BenchmarkDetailView";
import { BenchmarkCompareView } from "./BenchmarkCompareView";

interface BenchmarkModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  onMinimize?: (modalState: unknown) => void;
  enableSharedModalDimensions?: boolean;
}

type ViewMode = "list" | "detail" | "compare";

// Initialize storage
const storageAdapter = createAsyncStorageAdapter();
const storage = storageAdapter ? new BenchmarkStorage(storageAdapter) : null;

export function BenchmarkModal({
  visible,
  onClose,
  onBack,
  onMinimize,
  enableSharedModalDimensions = false,
}: BenchmarkModalProps) {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [reports, setReports] = useState<BenchmarkMetadata[]>([]);
  const [selectedReport, setSelectedReport] = useState<BenchmarkReport | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareReports, setCompareReports] = useState<{
    baseline: BenchmarkReport;
    comparison: BenchmarkReport;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const hasLoadedState = useRef(false);

  // Load reports on mount
  useEffect(() => {
    if (!visible || !storage) return;

    const loadReports = async () => {
      const list = await storage.listReports();
      setReports(list);
    };

    loadReports();
  }, [visible, refreshKey]);

  // Subscribe to recorder state changes
  useEffect(() => {
    const unsubscribe = benchmarkRecorder.subscribe((event) => {
      if (event === "start") {
        setIsRecording(true);
      } else if (event === "stop") {
        setIsRecording(false);
        // Refresh list after stopping
        setRefreshKey((k) => k + 1);
      }
    });

    // Sync initial state
    setIsRecording(benchmarkRecorder.isRecording());

    return unsubscribe;
  }, []);

  // Handle start/stop recording
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop and save
      const report = benchmarkRecorder.stopSession();
      if (report && storage) {
        await storage.saveReport(report);
        setRefreshKey((k) => k + 1);
      }
    } else {
      // Start new session
      const timestamp = new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      benchmarkRecorder.startSession({
        name: `Benchmark ${timestamp}`,
        captureMemory: true,
        verbose: false,
      });
    }
  }, [isRecording]);

  // Handle report press
  const handleReportPress = useCallback(
    async (metadata: BenchmarkMetadata) => {
      if (selectionMode) {
        // Toggle selection
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(metadata.id)) {
            next.delete(metadata.id);
          } else {
            // Max 2 selections for comparison
            if (next.size < 2) {
              next.add(metadata.id);
            }
          }
          return next;
        });
      } else {
        // Load and show detail
        if (!storage) return;
        const report = await storage.loadReport(metadata.id);
        if (report) {
          setSelectedReport(report);
          setViewMode("detail");
        }
      }
    },
    [selectionMode]
  );

  // Handle long press to enter selection mode
  const handleReportLongPress = useCallback((metadata: BenchmarkMetadata) => {
    setSelectionMode(true);
    setSelectedIds(new Set([metadata.id]));
  }, []);

  // Handle compare button
  const handleCompare = useCallback(async () => {
    if (selectedIds.size !== 2 || !storage) return;

    const ids = Array.from(selectedIds);
    const [report1, report2] = await Promise.all([
      storage.loadReport(ids[0]),
      storage.loadReport(ids[1]),
    ]);

    if (report1 && report2) {
      // Older report is baseline, newer is comparison
      const [baseline, comparison] =
        report1.createdAt < report2.createdAt
          ? [report1, report2]
          : [report2, report1];

      setCompareReports({ baseline, comparison });
      setViewMode("compare");
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  }, [selectedIds]);

  // Handle clear all
  const handleClearAll = useCallback(async () => {
    if (storage) {
      await storage.clearAll();
      setRefreshKey((k) => k + 1);
    }
  }, []);

  // Handle delete selected
  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0 || !storage) return;

    await Promise.all(
      Array.from(selectedIds).map((id) => storage.deleteReport(id))
    );
    setSelectedIds(new Set());
    setSelectionMode(false);
    setRefreshKey((k) => k + 1);
  }, [selectedIds]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (viewMode === "detail" || viewMode === "compare") {
      setViewMode("list");
      setSelectedReport(null);
      setCompareReports(null);
    } else if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    } else if (onBack) {
      onBack();
    }
  }, [viewMode, selectionMode, onBack]);

  // Handle rename current report
  const handleRename = useCallback(() => {
    if (!selectedReport || !storage) return;

    Alert.prompt(
      "Rename Benchmark",
      "Enter a new name for this benchmark:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (newName: string | undefined) => {
            if (newName && newName.trim()) {
              await storage.updateReport(selectedReport.id, { name: newName.trim() });
              // Update local state
              setSelectedReport({ ...selectedReport, name: newName.trim() });
              setRefreshKey((k) => k + 1);
            }
          },
        },
      ],
      "plain-text",
      ""
    );
  }, [selectedReport]);

  // Handle delete current report
  const handleDeleteCurrent = useCallback(async () => {
    if (!selectedReport || !storage) return;

    await storage.deleteReport(selectedReport.id);
    setViewMode("list");
    setSelectedReport(null);
    setRefreshKey((k) => k + 1);
  }, [selectedReport]);

  // Handle copy compare results
  const handleCopyCompare = useCallback(async () => {
    if (!compareReports) return;

    const { baseline, comparison } = compareReports;
    const result = BenchmarkComparator.compare(baseline, comparison);

    const formatMs = (ms: number): string => {
      if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
      if (ms < 10) return `${ms.toFixed(2)}ms`;
      if (ms < 100) return `${ms.toFixed(1)}ms`;
      return `${ms.toFixed(0)}ms`;
    };

    const formatPercent = (value: number): string => {
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(1)}%`;
    };

    const lines: string[] = [
      "BENCHMARK COMPARISON RESULTS",
      "============================",
      "",
      `Overall: ${result.isImproved ? "IMPROVED" : "REGRESSED"} ${formatPercent(result.overallImprovement)}`,
      "",
      "COMPARING",
      "---------",
      `Baseline: ${baseline.name}`,
      `  Date: ${new Date(baseline.createdAt).toLocaleString()}`,
      `Comparison: ${comparison.name}`,
      `  Date: ${new Date(comparison.createdAt).toLocaleString()}`,
      "",
      "TIMING COMPARISON",
      "-----------------",
      `Measure Time:    ${formatMs(baseline.stats.avgMeasureTime)} → ${formatMs(comparison.stats.avgMeasureTime)} (${formatPercent(result.measureTimeImprovement)})`,
      `Pipeline Time:   ${formatMs(baseline.stats.avgTotalTime)} → ${formatMs(comparison.stats.avgTotalTime)} (${formatPercent(result.pipelineTimeImprovement)})`,
      `Filter Time:     ${formatMs(baseline.stats.avgFilterTime)} → ${formatMs(comparison.stats.avgFilterTime)} (${formatPercent(result.filterTimeImprovement)})`,
      `Track Time:      ${formatMs(baseline.stats.avgTrackTime)} → ${formatMs(comparison.stats.avgTrackTime)} (${formatPercent(result.trackTimeImprovement)})`,
      `Overlay Render:  ${formatMs(baseline.stats.avgOverlayRenderTime)} → ${formatMs(comparison.stats.avgOverlayRenderTime)} (${formatPercent(result.overlayRenderImprovement)})`,
      "",
      "PERCENTILES",
      "-----------",
      `P50 (Median):    ${formatMs(baseline.stats.p50TotalTime)} → ${formatMs(comparison.stats.p50TotalTime)}`,
      `P95:             ${formatMs(baseline.stats.p95TotalTime)} → ${formatMs(comparison.stats.p95TotalTime)}`,
      `P99:             ${formatMs(baseline.stats.p99TotalTime)} → ${formatMs(comparison.stats.p99TotalTime)}`,
      "",
      "BATCH STATISTICS",
      "----------------",
      `Total Batches:    ${baseline.stats.batchCount} → ${comparison.stats.batchCount}`,
      `Nodes Processed:  ${baseline.stats.totalNodesProcessed.toLocaleString()} → ${comparison.stats.totalNodesProcessed.toLocaleString()}`,
    ];

    if (baseline.memoryDelta != null && comparison.memoryDelta != null) {
      lines.push(
        "",
        "MEMORY",
        "------",
        `Memory Delta:    ${(baseline.memoryDelta / 1024 / 1024).toFixed(2)}MB → ${(comparison.memoryDelta / 1024 / 1024).toFixed(2)}MB`
      );
    }

    lines.push(
      "",
      `Compared at: ${new Date(result.comparedAt).toLocaleString()}`
    );

    await copyToClipboard(lines.join("\n"));
  }, [compareReports]);

  // Render list item
  const renderItem = useCallback(
    ({ item }: { item: BenchmarkMetadata }) => (
      <BenchmarkSessionCard
        metadata={item}
        isSelected={selectedIds.has(item.id)}
        onPress={() => handleReportPress(item)}
        onLongPress={() => handleReportLongPress(item)}
        selectionMode={selectionMode}
      />
    ),
    [selectionMode, selectedIds, handleReportPress, handleReportLongPress]
  );

  const keyExtractor = useCallback((item: BenchmarkMetadata) => item.id, []);

  // Render content
  const renderContent = () => {
    if (viewMode === "detail" && selectedReport) {
      return <BenchmarkDetailView report={selectedReport} />;
    }

    if (viewMode === "compare" && compareReports) {
      return (
        <BenchmarkCompareView
          baseline={compareReports.baseline}
          comparison={compareReports.comparison}
        />
      );
    }

    // List view
    if (reports.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Benchmarks Yet</Text>
          <Text style={styles.emptySubtitle}>
            Press the record button to start capturing performance metrics
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={reports}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    );
  };

  if (!visible) return null;

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.benchmark.modal();

  // Header title based on view mode
  const headerTitle = useMemo(() => {
    if (viewMode === "detail" && selectedReport) {
      return selectedReport.name;
    }
    if (viewMode === "compare") {
      return "Compare";
    }
    if (selectionMode) {
      if (selectedIds.size === 0) {
        return "Select 2 to compare";
      }
      if (selectedIds.size === 1) {
        return "Select 1 more";
      }
      return `${selectedIds.size} Selected`;
    }
    return "Benchmarks";
  }, [viewMode, selectedReport, selectionMode, selectedIds]);

  // Determine back handler
  const showBackButton = viewMode !== "list" || selectionMode || onBack;

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      onBack={showBackButton ? handleBack : undefined}
      onMinimize={onMinimize}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: (
          <ModalHeader>
            {showBackButton && (
              <ModalHeader.Navigation onBack={handleBack} />
            )}
            <ModalHeader.Content title={headerTitle} />
            <ModalHeader.Actions>
              {viewMode === "list" && !selectionMode && (
                <>
                  {/* Recording button */}
                  <TouchableOpacity
                    onPress={handleToggleRecording}
                    style={[
                      styles.iconButton,
                      isRecording && styles.recordingButton,
                    ]}
                  >
                    {isRecording ? (
                      <Pause size={14} color={macOSColors.semantic.error} />
                    ) : (
                      <Play size={14} color={macOSColors.semantic.success} />
                    )}
                  </TouchableOpacity>

                  {/* Compare button - enter selection mode */}
                  {reports.length >= 2 && (
                    <TouchableOpacity
                      onPress={() => setSelectionMode(true)}
                      style={styles.iconButton}
                    >
                      <GitBranch size={14} color={macOSColors.semantic.info} />
                    </TouchableOpacity>
                  )}

                  {/* Refresh button */}
                  <TouchableOpacity
                    onPress={() => setRefreshKey((k) => k + 1)}
                    style={styles.iconButton}
                  >
                    <RefreshCw size={14} color={macOSColors.text.secondary} />
                  </TouchableOpacity>

                  {/* Clear all button */}
                  {reports.length > 0 && (
                    <TouchableOpacity
                      onPress={handleClearAll}
                      style={styles.iconButton}
                    >
                      <Trash2 size={14} color={macOSColors.semantic.error} />
                    </TouchableOpacity>
                  )}
                </>
              )}

              {viewMode === "detail" && selectedReport && (
                <>
                  {/* Rename button */}
                  <TouchableOpacity
                    onPress={handleRename}
                    style={styles.iconButton}
                  >
                    <Edit3 size={14} color={macOSColors.text.secondary} />
                  </TouchableOpacity>

                  {/* Delete button */}
                  <TouchableOpacity
                    onPress={handleDeleteCurrent}
                    style={styles.iconButton}
                  >
                    <Trash2 size={14} color={macOSColors.semantic.error} />
                  </TouchableOpacity>
                </>
              )}

              {viewMode === "compare" && compareReports && (
                <>
                  {/* Copy results button */}
                  <TouchableOpacity
                    onPress={handleCopyCompare}
                    style={styles.iconButton}
                  >
                    <Copy size={14} color={macOSColors.text.secondary} />
                  </TouchableOpacity>
                </>
              )}

              {selectionMode && (
                <>
                  {/* Compare button (only when 2 selected) */}
                  {selectedIds.size === 2 && (
                    <TouchableOpacity
                      onPress={handleCompare}
                      style={[styles.iconButton, styles.compareButton]}
                    >
                      <GitBranch size={14} color={macOSColors.semantic.info} />
                    </TouchableOpacity>
                  )}

                  {/* Delete selected */}
                  {selectedIds.size > 0 && (
                    <TouchableOpacity
                      onPress={handleDeleteSelected}
                      style={styles.iconButton}
                    >
                      <Trash2 size={14} color={macOSColors.semantic.error} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ModalHeader.Actions>
          </ModalHeader>
        ),
      }}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
    >
      {/* Recording indicator banner */}
      {isRecording && viewMode === "list" && (
        <View style={styles.recordingBanner}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
          <TouchableOpacity
            onPress={handleToggleRecording}
            style={styles.stopButton}
          >
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderContent()}
    </JsModal>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: macOSColors.background.hover,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingButton: {
    backgroundColor: macOSColors.semantic.errorBackground,
    borderColor: macOSColors.semantic.error,
  },
  compareButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info,
  },
  listContent: {
    paddingVertical: 16,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    textAlign: "center",
  },
  recordingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.semantic.errorBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: macOSColors.semantic.error,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: macOSColors.semantic.error,
    marginRight: 8,
  },
  recordingText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.semantic.error,
    fontFamily: "monospace",
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: macOSColors.semantic.error,
    borderRadius: 4,
  },
  stopButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "monospace",
  },
});

export default BenchmarkModal;
