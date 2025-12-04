/**
 * Standalone Debug Borders Overlay
 *
 * This component renders debug borders independently of the Provider.
 * It should be rendered at the root level of the app to ensure it appears on top.
 *
 * Supports two display modes:
 * - "borders" - Shows colored borders only
 * - "labels" - Shows colored borders with component labels
 *
 * Automatically hides borders when DevTools modals are open to avoid visual clutter.
 */

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Import JsModal from shared
let JsModal: React.ComponentType<any> | null = null;
let DataViewer: React.ComponentType<any> | null = null;
try {
  const sharedModule = require("@react-buoy/shared-ui");
  JsModal = sharedModule.JsModal;
} catch (e) {
  // JsModal not available
}
try {
  const dataViewerModule = require("@react-buoy/shared-ui/dataViewer");
  DataViewer = dataViewerModule.DataViewer;
} catch (e) {
  // DataViewer not available
}

const DebugBordersManager = require("../utils/DebugBordersManager");
const { getAllHostComponentInstances } = require("../utils/fiberTreeTraversal");
const { measureInstances } = require("../utils/componentMeasurement");
const { getColorForDepth } = require("../utils/colorGeneration");
const { getShortLabel } = require("../utils/componentInfo");
const { resolveOverlappingLabels } = require("../utils/labelPositioning");

// Import DevToolsVisibility context to detect when DevTools are open
let useDevToolsVisibility: (() => { isDevToolsActive: boolean }) | null = null;
try {
  // Optional import - will gracefully fail if not available
  const coreModule = require("@react-buoy/core");
  useDevToolsVisibility = coreModule.useDevToolsVisibility;
} catch (e) {
  // DevToolsVisibility not available, that's ok - borders will always work
}

type DisplayMode = "off" | "borders" | "labels";

interface ComponentInfo {
  viewType: string;
  displayName: string;
  componentName: string | null;
  parentComponentName: string | null;
  testID: string | null;
  nativeID: string | null;
  accessibilityLabel: string | null;
  accessibilityRole: string | null;
  accessibilityHint: string | null;
  accessibilityState: Record<string, unknown> | null;
  fiberTag: number;
  fiberKey: string | null;
  styleInfo: Record<string, unknown> | null;
  primaryLabel: string;
  primaryType: string;
  primaryColor: string;
}

interface RectangleData {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  componentInfo: ComponentInfo;
  labelOffsetY?: number;
}

// Row component for displaying info
function InfoRow({
  label,
  value,
  color,
}: {
  label: string;
  value: unknown;
  color?: string;
}) {
  if (value === null || value === undefined) return null;

  let displayValue: string;
  if (typeof value === "object") {
    try {
      displayValue = JSON.stringify(value, null, 2);
    } catch {
      displayValue = String(value);
    }
  } else {
    displayValue = String(value);
  }

  return (
    <View style={modalStyles.row}>
      <Text style={modalStyles.label}>{label}</Text>
      <Text style={[modalStyles.value, color ? { color } : null]}>
        {displayValue}
      </Text>
    </View>
  );
}

// Simple header with just title (no hints)
function SimpleHeader({ title }: { title: string }) {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

// Component Info Modal Content
function ComponentInfoContent({
  info,
  rect,
}: {
  info: ComponentInfo;
  rect: RectangleData;
}) {
  return (
    <View style={modalStyles.content}>
      {/* Identifiers Section */}
      <Text style={modalStyles.sectionTitle}>Identifiers</Text>
      <InfoRow label="testID" value={info.testID} color="#10b981" />
      <InfoRow
        label="accessibilityLabel"
        value={info.accessibilityLabel}
        color="#ec4899"
      />
      <InfoRow label="nativeID" value={info.nativeID} color="#f59e0b" />
      <InfoRow label="key" value={info.fiberKey} />

      {/* Component Info Section */}
      <Text style={modalStyles.sectionTitle}>Component</Text>
      <InfoRow label="Component Name" value={info.componentName} color="#a855f7" />
      <InfoRow label="Parent Component" value={info.parentComponentName} />
      <InfoRow label="Display Name" value={info.displayName} />
      <InfoRow label="Native View Type" value={info.viewType} />
      <InfoRow label="Fiber Tag" value={info.fiberTag} />

      {/* Position Section */}
      <Text style={modalStyles.sectionTitle}>Position & Size</Text>
      <InfoRow label="X" value={Math.round(rect.x)} />
      <InfoRow label="Y" value={Math.round(rect.y)} />
      <InfoRow label="Width" value={Math.round(rect.width)} />
      <InfoRow label="Height" value={Math.round(rect.height)} />
      <InfoRow label="Depth" value={rect.depth} />

      {/* Accessibility Section */}
      {(info.accessibilityRole ||
        info.accessibilityHint ||
        info.accessibilityState) && (
        <>
          <Text style={modalStyles.sectionTitle}>Accessibility</Text>
          <InfoRow label="Role" value={info.accessibilityRole} />
          <InfoRow label="Hint" value={info.accessibilityHint} />
          {info.accessibilityState && DataViewer ? (
            <DataViewer
              title="State"
              data={info.accessibilityState}
              showTypeFilter={false}
              initialExpanded={true}
            />
          ) : (
            <InfoRow label="State" value={info.accessibilityState} />
          )}
        </>
      )}

      {/* Style Section */}
      {info.styleInfo && (
        <>
          <Text style={modalStyles.sectionTitle}>Styles</Text>
          {DataViewer ? (
            <DataViewer
              title="Styles"
              data={info.styleInfo}
              showTypeFilter={false}
              initialExpanded={true}
            />
          ) : (
            <View style={modalStyles.codeBlock}>
              <Text style={modalStyles.codeText}>
                {JSON.stringify(info.styleInfo, null, 2)}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export function DebugBordersStandaloneOverlay() {
  const [mode, setMode] = useState<DisplayMode>("off");
  const [rectangles, setRectangles] = useState<RectangleData[]>([]);
  const [selectedRect, setSelectedRect] = useState<RectangleData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const measuringRef = React.useRef(false); // Prevent overlapping measurements

  // Check if any DevTools are open (if context is available)
  const isDevToolsActive = useDevToolsVisibility?.()?.isDevToolsActive ?? false;

  const handleLabelPress = useCallback((rect: RectangleData) => {
    setSelectedRect(rect);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedRect(null);
  }, []);

  // Effective enabled state: user enabled AND no DevTools active
  const isEnabled = mode !== "off" && !isDevToolsActive;
  const showLabels = mode === "labels" && !isDevToolsActive;

  // Subscribe to manager
  useEffect(() => {
    const unsubscribe = DebugBordersManager.subscribe((newMode: DisplayMode) => {
      setMode(newMode);
    });
    return unsubscribe;
  }, []);

  // Update measurements when enabled
  useEffect(() => {
    if (!isEnabled) {
      setRectangles([]);
      return;
    }

    let mounted = true;
    let timer: ReturnType<typeof setInterval>;

    const updateMeasurements = async () => {
      if (!mounted || measuringRef.current) {
        return;
      }

      measuringRef.current = true;

      try {
        const instances = getAllHostComponentInstances();
        if (instances.length === 0) {
          measuringRef.current = false;
          return;
        }

        const measurements = await measureInstances(instances);

        if (mounted) {
          // Resolve overlapping labels when in labels mode
          const processedMeasurements = showLabels
            ? resolveOverlappingLabels(measurements)
            : measurements;
          setRectangles(processedMeasurements);
        }
      } catch (error) {
        console.error("[DebugBorders] Error updating measurements:", error);
      } finally {
        measuringRef.current = false;
      }
    };

    // Initial measurement with delay to let UI settle
    const initialTimer = setTimeout(() => {
      updateMeasurements();
    }, 500);

    // Periodic updates (less frequent to avoid performance issues)
    timer = setInterval(updateMeasurements, 2000);

    return () => {
      mounted = false;
      clearTimeout(initialTimer);
      clearInterval(timer);
      measuringRef.current = false;
    };
  }, [isEnabled, showLabels, rectangles.length]);

  if (!isEnabled) {
    return null;
  }

  return (
    <View
      style={styles.overlay}
      pointerEvents="box-none"
      // @ts-ignore - custom prop to identify this as debug overlay
      dataSet={{ debugOverlay: "true" }}
      nativeID="debug-borders-overlay"
    >
      {/* Render borders and labels */}
      {rectangles.map((rect, index) => {
        const info = rect.componentInfo;
        const hasValidLabel = info && (info.testID || info.accessibilityLabel);

        // In labels mode, only show components with testID or accessibilityLabel
        if (showLabels && !hasValidLabel) {
          return null;
        }

        // Use label color for border when in labels mode, otherwise use depth-based color
        const borderColor = showLabels && info
          ? info.primaryColor
          : getColorForDepth(rect.depth);

        return (
          <React.Fragment key={`border-${index}`}>
            {/* Border box */}
            <View
              pointerEvents="none"
              style={[
                styles.border,
                {
                  left: rect.x,
                  top: rect.y,
                  width: rect.width,
                  height: rect.height,
                  borderColor: borderColor,
                },
              ]}
            />
            {/* Label positioned outside/above the box - tappable */}
            {showLabels && hasValidLabel && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleLabelPress(rect)}
                style={[
                  styles.labelContainer,
                  {
                    left: rect.x,
                    top: rect.y - 10 - (rect.labelOffsetY || 0),
                    backgroundColor: info.primaryColor,
                  },
                ]}
              >
                <Text
                  style={styles.labelText}
                  numberOfLines={1}
                >
                  {info.primaryLabel}
                </Text>
              </TouchableOpacity>
            )}
          </React.Fragment>
        );
      })}

      {/* Component Info Modal using JsModal */}
      {JsModal && selectedRect?.componentInfo && (
        <JsModal
          visible={modalVisible}
          onClose={handleCloseModal}
          initialMode="bottomSheet"
          header={{
            customContent: (
              <SimpleHeader title={selectedRect.componentInfo.primaryLabel} />
            ),
          }}
          persistenceKey="debug-borders-info-modal"
          enablePersistence={false}
        >
          <ComponentInfoContent
            info={selectedRect.componentInfo}
            rect={selectedRect}
          />
        </JsModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Use z-index below floating dev tools (9999-10001) but above normal app content
    zIndex: 9000,
    elevation: 9000,
  },
  border: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "solid",
  },
  labelContainer: {
    position: "absolute",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  labelText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "monospace",
    color: "#ffffff",
  },
});

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "monospace",
  },
});

const modalStyles = StyleSheet.create({
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  label: {
    fontSize: 13,
    color: "#9ca3af",
    width: 140,
    fontFamily: "monospace",
  },
  value: {
    fontSize: 13,
    color: "#ffffff",
    flex: 1,
    fontFamily: "monospace",
  },
  codeBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  codeText: {
    fontSize: 11,
    color: "#e5e7eb",
    fontFamily: "monospace",
  },
});
