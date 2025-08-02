import React, { useState, useEffect, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
// AsyncStorage import with fallback for when it's not available
let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (error) {
  // AsyncStorage not available - will fall back to in-memory storage
  console.warn(
    "AsyncStorage not found. Panel position will not persist across app restarts. To enable persistence, install @react-native-async-storage/async-storage"
  );
}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import DragResizable from "../../../_shared/DragResizable";
import { Maximize2, Minimize2, X } from "lucide-react-native";

// Stable constants moved to module scope to prevent re-renders
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MIN_HEIGHT = 150;
const MIN_WIDTH = 300;
const DEFAULT_HEIGHT = 400;
const DEFAULT_WIDTH = SCREEN_WIDTH - 40;
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

// Fallback in-memory storage when AsyncStorage is not available
const memoryStorage: Record<string, string> = {};

// Helper functions for persisting panel state with AsyncStorage fallback
const setItem = async (key: string, value: string) => {
  if (AsyncStorage) {
    await AsyncStorage.setItem(key, value);
  } else {
    memoryStorage[key] = value;
  }
};

const getItem = async (key: string): Promise<string | null> => {
  if (AsyncStorage) {
    return await AsyncStorage.getItem(key);
  } else {
    return memoryStorage[key] || null;
  }
};

// Storage operations
const savePanelDimensions = async (
  storagePrefix: string,
  dimensions: { width: number; height: number; top: number; left: number }
) => {
  try {
    await setItem(
      `${storagePrefix}_panel_dimensions`,
      JSON.stringify(dimensions)
    );
  } catch (error) {
    console.warn("Failed to save panel dimensions:", error);
  }
};

const savePanelHeight = async (storagePrefix: string, height: number) => {
  try {
    await setItem(`${storagePrefix}_panel_height`, height.toString());
  } catch (error) {
    console.warn("Failed to save panel height:", error);
  }
};

const saveFloatingMode = async (storagePrefix: string, isFloating: boolean) => {
  try {
    await setItem(`${storagePrefix}_is_floating_mode`, isFloating.toString());
  } catch (error) {
    console.warn("Failed to save floating mode:", error);
  }
};

const loadPanelState = async (storagePrefix: string) => {
  try {
    const [dimensionsStr, heightStr, floatingModeStr] = await Promise.all([
      getItem(`${storagePrefix}_panel_dimensions`),
      getItem(`${storagePrefix}_panel_height`),
      getItem(`${storagePrefix}_is_floating_mode`),
    ]);

    const dimensions = dimensionsStr ? JSON.parse(dimensionsStr) : null;
    const height = heightStr ? parseInt(heightStr, 10) : null;
    const isFloating = floatingModeStr ? floatingModeStr === "true" : null;

    return { dimensions, height, isFloating };
  } catch (error) {
    console.warn("Failed to load panel state:", error);
    return { dimensions: null, height: null, isFloating: null };
  }
};

// Stable callbacks moved to module scope to prevent re-renders
const RESIZE_HANDLERS: Array<
  "bottomLeft" | "bottomRight" | "topLeft" | "topRight"
> = ["bottomLeft", "bottomRight", "topLeft", "topRight"];

// Custom corner resize handle component with drag feedback
const CornerResizeHandle = ({
  handler,
  isActive,
}: {
  handler: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  isActive?: boolean;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <View
      style={[
        cornerHandleStyles.cornerHandle,
        cornerHandleStyles[handler],
        (isDragging || isActive) && cornerHandleStyles.cornerHandleDragging,
      ]}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchCancel={() => setIsDragging(false)}
      hitSlop={HIT_SLOP}
    />
  );
};

interface BaseFloatingModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  storagePrefix: string; // Unique prefix for storing modal state
  showToggleButton?: boolean; // Whether to show the floating mode toggle
  customHeaderContent?: ReactNode; // Custom content to render in header
  headerSubtitle?: string; // Optional subtitle to show below the main header content
}

export function BaseFloatingModal({
  visible,
  onClose,
  children,
  storagePrefix,
  showToggleButton = true,
  customHeaderContent,
  headerSubtitle,
}: BaseFloatingModalProps) {
  const [isFloatingMode, setIsFloatingMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const insets = useSafeAreaInsets();

  // State for drag/resize container bounds
  const [containerBounds, setContainerBounds] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - insets.top - insets.bottom,
  });

  // State for panel dimensions
  const [panelDimensions, setPanelDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    top: 100,
    left: 20,
  });

  // Load persisted state on component mount
  useEffect(() => {
    const loadState = async () => {
      const { dimensions, height, isFloating } = await loadPanelState(
        storagePrefix
      );

      if (dimensions) {
        // Validate stored dimensions are within current screen bounds
        const validatedDimensions = {
          width: Math.max(
            MIN_WIDTH,
            Math.min(dimensions.width, SCREEN_WIDTH - 40)
          ),
          height: Math.max(
            MIN_HEIGHT,
            Math.min(dimensions.height, SCREEN_HEIGHT - 200)
          ),
          top: Math.max(
            0,
            Math.min(dimensions.top, SCREEN_HEIGHT - MIN_HEIGHT)
          ),
          left: Math.max(
            0,
            Math.min(dimensions.left, SCREEN_WIDTH - MIN_WIDTH)
          ),
        };
        setPanelDimensions(validatedDimensions);
      }

      if (height !== null) {
        const validatedHeight = Math.max(
          MIN_HEIGHT,
          Math.min(height, SCREEN_HEIGHT - insets.top)
        );
        setPanelHeight(validatedHeight);
      }

      if (isFloating !== null) {
        setIsFloatingMode(isFloating);
      }

      setIsStateLoaded(true);
    };

    loadState();
  }, [storagePrefix, insets.top, insets.bottom]);

  // Update container bounds when screen orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setContainerBounds({
        width: window.width,
        height: window.height - insets.top - insets.bottom,
      });
    });
    return () => subscription?.remove();
  }, [insets.top, insets.bottom]);

  // Simple callback functions for drag/resize events
  const handleDragEnd = (dimensions: any) => {
    const newDimensions = {
      ...panelDimensions,
      top: dimensions.top,
      left: dimensions.left,
    };
    setPanelDimensions(newDimensions);
    setIsDragging(false);
    // Save to storage
    savePanelDimensions(storagePrefix, newDimensions);
  };

  const handleResizeEnd = (dimensions: any) => {
    setPanelDimensions(dimensions);
    setIsResizing(false);
    // Save to storage
    savePanelDimensions(storagePrefix, dimensions);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  // Updated render function to return the component with access to state
  const renderCornerHandle = ({
    handler,
  }: {
    handler: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  }) => {
    return (
      <CornerResizeHandle
        handler={handler}
        isActive={isDragging || isResizing}
      />
    );
  };

  // Toggle between floating and bottom sheet modes
  const toggleFloatingMode = () => {
    const newMode = !isFloatingMode;
    setIsFloatingMode(newMode);
    // Save to storage
    saveFloatingMode(storagePrefix, newMode);
  };

  // Bottom sheet height management (for non-floating mode)
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const MAX_HEIGHT = SCREEN_HEIGHT - insets.top;

  // Reanimated shared values for smooth resizing
  const sharedHeight = useSharedValue(DEFAULT_HEIGHT);
  const offsetHeight = useSharedValue(0);

  // Update shared value when state changes
  useEffect(() => {
    sharedHeight.value = panelHeight;
  }, [panelHeight]);

  // Save panel height to storage when it changes (debounced to avoid excessive writes)
  useEffect(() => {
    if (isStateLoaded) {
      const timeoutId = setTimeout(() => {
        savePanelHeight(storagePrefix, panelHeight);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [panelHeight, isStateLoaded, storagePrefix]);

  // Header-based resize gesture for bottom sheet mode
  const resizeGesture = Gesture.Pan()
    .enabled(!isFloatingMode)
    .onBegin(() => {
      "worklet";
      offsetHeight.value = sharedHeight.value;
      runOnJS(setIsResizing)(true);
    })
    .onUpdate((event) => {
      "worklet";
      // Bottom sheet: dragging up (negative dy) increases height
      const newHeight = offsetHeight.value - event.translationY;
      const clampedHeight = clamp(newHeight, MIN_HEIGHT, MAX_HEIGHT);
      sharedHeight.value = clampedHeight;

      // Update React state on JS thread
      runOnJS(setPanelHeight)(clampedHeight);
    })
    .onEnd(() => {
      "worklet";
      // Final height is already set via runOnJS
      runOnJS(setIsResizing)(false);
    })
    .onFinalize(() => {
      "worklet";
      runOnJS(setIsResizing)(false);
    });

  // Animated style for smooth height transitions
  const animatedPanelStyle = useAnimatedStyle(() => ({
    height: sharedHeight.value,
  }));

  // Animated border style for drag/resize feedback (only for floating mode)
  const animatedBorderStyle = useAnimatedStyle(() => {
    const normalBorder = "rgba(255, 255, 255, 0.1)";
    const activeBorder = "rgba(34, 197, 94, 1)";
    // Only show green border when in floating mode and actively dragging/resizing
    const isActive = isFloatingMode && (isDragging || isResizing);

    return {
      borderColor: isActive ? activeBorder : normalBorder,
      borderWidth: isActive ? 2 : 1,
      shadowColor: isActive ? "rgba(34, 197, 94, 0.6)" : "#000",
      shadowOpacity: isActive ? 0.8 : 0.3,
      shadowRadius: isActive ? 12 : 8,
      elevation: isActive ? 20 : 16,
    };
  });

  if (!visible || !isStateLoaded) return null;

  // Helper function to render the header with controls
  const renderHeader = () => {
    const headerContent = (
      <View style={styles.header}>
        {/* Drag indicator at top of header for visual feedback */}
        {!isFloatingMode && (
          <View style={styles.dragIndicator}>
            <View
              style={[styles.resizeGrip, isResizing && styles.resizeGripActive]}
            />
          </View>
        )}
        <View style={styles.headerContent}>
          <View style={styles.mainHeaderRow}>
            {customHeaderContent && (
              <View style={styles.customHeaderContent}>
                {customHeaderContent}
              </View>
            )}
            <View style={styles.headerControls}>
              {showToggleButton && (
                <Pressable
                  onPress={toggleFloatingMode}
                  style={[styles.controlButton, styles.controlButtonSecondary]}
                  hitSlop={HIT_SLOP}
                >
                  {isFloatingMode ? (
                    <Minimize2 color="#E5E7EB" size={16} />
                  ) : (
                    <Maximize2 color="#E5E7EB" size={16} />
                  )}
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                style={[styles.controlButton, styles.controlButtonDanger]}
                hitSlop={HIT_SLOP}
              >
                <X color="#FFFFFF" size={16} />
              </Pressable>
            </View>
          </View>
          {headerSubtitle && (
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>{headerSubtitle}</Text>
            </View>
          )}
        </View>
      </View>
    );

    // In bottom sheet mode, wrap the entire header with gesture detector
    if (!isFloatingMode) {
      return (
        <GestureDetector gesture={resizeGesture}>
          {headerContent}
        </GestureDetector>
      );
    }

    // In floating mode, just return the header without gesture
    return headerContent;
  };

  // Helper function to render the content with proper layout
  const renderPanelContent = () => (
    <>
      {renderHeader()}
      <View style={styles.content}>{children}</View>
    </>
  );

  return (
    <>
      {isFloatingMode ? (
        // Floating Mode - Draggable and resizable
        <View
          style={styles.container}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setContainerBounds({ width, height });
          }}
          pointerEvents="box-none"
        >
          <DragResizable
            heightBound={containerBounds.height}
            widthBound={containerBounds.width}
            left={panelDimensions.left}
            top={panelDimensions.top}
            width={panelDimensions.width}
            height={panelDimensions.height}
            minWidth={MIN_WIDTH}
            minHeight={MIN_HEIGHT}
            isDraggable={true}
            isResizable={true}
            resizeHandlers={RESIZE_HANDLERS}
            renderHandler={renderCornerHandle}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onResizeStart={handleResizeStart}
            onResizeEnd={handleResizeEnd}
            style={styles.dragResizableContainer}
          >
            <Animated.View
              style={[styles.panel, styles.panelFloating, animatedBorderStyle]}
            >
              {renderPanelContent()}
            </Animated.View>
          </DragResizable>
        </View>
      ) : (
        // Bottom Sheet Mode - Traditional modal
        <View
          style={[styles.overlay, { paddingTop: insets.top }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.panel,
              styles.panelBottomSheet,
              animatedPanelStyle,
              animatedBorderStyle,
            ]}
          >
            {renderPanelContent()}
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Container for DragResizable component
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },

  // Base overlay for bottom sheet mode
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },

  // Style for the DragResizable wrapper
  dragResizableContainer: {
    backgroundColor: "transparent",
  },
  panel: {
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // Match main dev tools border
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },

  // Floating mode panel should flex
  panelFloating: {
    flex: 1,
  },

  // Bottom sheet specific styles
  panelBottomSheet: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    shadowOffset: { width: 0, height: -4 },
  },

  resizeGrip: {
    width: 32,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Match DevToolsHeader drag indicator
    borderRadius: 1.5,
  },
  resizeGripActive: {
    backgroundColor: "rgba(34, 197, 94, 0.8)",
    height: 4,
  },

  // Header matching DevToolsHeader exactly
  header: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
    backgroundColor: "#171717", // Exact match with main dev tools
  },

  // Drag indicator at top of header (like DevToolsHeader)
  dragIndicator: {
    height: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#171717",
  },

  // Header content matching DevToolsHeader patterns but single row for floating
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)", // Exact match with DevToolsHeader
    backgroundColor: "#171717",
  },

  // Subtitle container and text styles
  subtitleContainer: {
    paddingTop: 4,
    paddingBottom: 2,
  },

  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "400",
  },

  // Main header row layout
  mainHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32, // Ensure minimum height for buttons
  },

  // Custom header content container
  customHeaderContent: {
    flex: 1,
  },

  // Header controls container
  headerControls: {
    flexDirection: "row",
    gap: 6,
    zIndex: 1001, // Higher than corner handles (1000) to ensure button clicks work
    paddingRight: 4, // Add some padding to move buttons away from edge
  },

  // Control buttons matching DevToolsHeader exactly
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)", // Exact match with DevToolsHeader
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)", // Exact match with DevToolsHeader
    zIndex: 1002, // Ensure buttons are above corner handles
  },
  controlButtonSecondary: {
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    borderColor: "rgba(156, 163, 175, 0.2)",
  },
  controlButtonDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },

  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },
});

// Corner handle styles for custom resize handles
const cornerHandleStyles = StyleSheet.create({
  cornerHandle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10, // Perfect circle (width/height / 2)
    zIndex: 1000,
    // Invisible by default - no background or border
  },
  topLeft: {
    top: 4,
    left: 4,
  },
  topRight: {
    top: 4,
    right: 4,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
  },
  bottomRight: {
    bottom: 4,
    right: 4,
  },
  cornerHandleDragging: {
    backgroundColor: "rgba(34, 197, 94, 0.1)", // Same green as FloatingStatusBubble
    borderColor: "rgba(34, 197, 94, 1)", // Same green border as FloatingStatusBubble
    borderWidth: 2,
    // Add subtle shadow like the bubble
    shadowColor: "rgba(34, 197, 94, 0.6)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
