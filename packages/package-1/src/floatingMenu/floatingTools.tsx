import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
  createContext,
  useCallback,
  Children,
  ReactNode,
} from "react";
import {
  Animated,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import {
  gameUIColors,
  getSafeAreaInsets,
  safeGetItem,
  safeSetItem,
} from "@monorepo/shared";
import { DraggableHeader } from "./DraggableHeader";
import { useSafeAreaInsets } from "@monorepo/shared/src/hooks/useSafeAreaInsets";

// Using Views to render grip dots; no react-native-svg dependency

// =============================
// Local Types (self-contained)
// =============================
export type UserRole = "admin" | "internal" | "user";

// =============================
// Icons (self-contained)
// =============================
/**
 * Grip icon component for draggable areas
 *
 * Renders a vertical grip pattern using View components to avoid SVG dependencies.
 * Creates two columns of three dots each with responsive sizing.
 *
 * @param props - Icon configuration
 * @param props.size - Size of the icon in pixels (default: 24)
 * @param props.color - Color of the grip dots (default: gameUIColors.secondary + "CC")
 * @returns JSX.Element representing the grip icon
 */
function GripVerticalIcon({
  size = 24,
  color = gameUIColors.secondary + "CC",
}: {
  size?: number;
  color?: string;
}) {
  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  };

  const dotSize = Math.max(2, Math.round(size / 6));
  const columnGap = Math.max(2, Math.round(size / 12));
  const rowGap = Math.max(2, Math.round(size / 12));

  const columnStyle: ViewStyle = {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: columnGap / 2,
  };

  const dotStyle: ViewStyle = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: color,
    marginVertical: rowGap / 2,
  };

  return (
    <View style={containerStyle}>
      <View style={columnStyle}>
        <View style={dotStyle} />
        <View style={dotStyle} />
        <View style={dotStyle} />
      </View>
      <View style={columnStyle}>
        <View style={dotStyle} />
        <View style={dotStyle} />
        <View style={dotStyle} />
      </View>
    </View>
  );
}

const STORAGE_KEYS = {
  BUBBLE_POSITION_X: "@floating_tools_bubble_position_x",
  BUBBLE_POSITION_Y: "@floating_tools_bubble_position_y",
} as const;

const debugLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.log("[FloatingTools]", ...args);
  }
};

// =============================
// Position persistence hook
// Extracted logic dedicated to state/IO
// =============================
/**
 * Custom hook for managing floating tools position persistence
 *
 * Handles loading, saving, and validating the position of the floating tools bubble
 * with automatic boundary checking and storage management.
 *
 * @param props - Configuration for position management
 * @param props.animatedPosition - Animated.ValueXY for position updates
 * @param props.bubbleWidth - Width of the bubble for boundary calculations
 * @param props.bubbleHeight - Height of the bubble for boundary calculations
 * @param props.enabled - Whether position persistence is enabled
 * @param props.visibleHandleWidth - Width of visible handle when bubble is hidden
 * @param props.listenersSuspended - Pause automatic listeners without disabling manual saves
 *
 * @returns Object containing position management functions
 *
 * @performance Uses debounced saving to avoid excessive storage operations
 * @performance Validates positions against screen boundaries and safe areas
 */
function useFloatingToolsPosition({
  animatedPosition,
  bubbleWidth = 100,
  bubbleHeight = 32,
  enabled = true,
  visibleHandleWidth = 32,
  listenersSuspended = false,
}: {
  animatedPosition: Animated.ValueXY;
  bubbleWidth?: number;
  bubbleHeight?: number;
  enabled?: boolean;
  visibleHandleWidth?: number;
  listenersSuspended?: boolean;
}) {
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const savePosition = useCallback(
    async (x: number, y: number) => {
      if (!enabled) return;
      debugLog("Saving bubble position", { x, y });
      try {
        await Promise.all([
          safeSetItem(STORAGE_KEYS.BUBBLE_POSITION_X, x.toString()),
          safeSetItem(STORAGE_KEYS.BUBBLE_POSITION_Y, y.toString()),
        ]);
        debugLog("Position persisted");
      } catch (error) {
        console.warn("[FloatingTools] Failed to save position:", error);
      }
    },
    [enabled]
  );

  const debouncedSavePosition = useCallback(
    (x: number, y: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => savePosition(x, y), 500);
      debugLog("Scheduled debounced position save", { x, y });
    },
    [savePosition]
  );

  const loadPosition = useCallback(async (): Promise<{
    x: number;
    y: number;
  } | null> => {
    if (!enabled) return null;
    debugLog("Attempting to load persisted position");
    try {
      const [xStr, yStr] = await Promise.all([
        safeGetItem(STORAGE_KEYS.BUBBLE_POSITION_X),
        safeGetItem(STORAGE_KEYS.BUBBLE_POSITION_Y),
      ]);
      if (xStr !== null && yStr !== null) {
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        if (!Number.isNaN(x) && !Number.isNaN(y)) return { x, y };
      }
    } catch (error) {
      console.warn("[FloatingTools] Failed to load position:", error);
    }
    debugLog("No persisted position found");
    return null;
  }, [enabled]);

  const validatePosition = useCallback(
    (position: { x: number; y: number }) => {
      const { width: screenWidth, height: screenHeight } =
        Dimensions.get("window");
      const safeArea = getSafeAreaInsets();
      // Prevent going off left, top, and bottom edges with safe area
      // Allow pushing off-screen to the right so only the grab handle remains visible
      const minX = safeArea.left; // Respect safe area left
      const maxX = screenWidth - visibleHandleWidth; // no right padding, ensure handle is visible
      // Add small padding below the safe area top to ensure bubble doesn't go behind notch
      const minY = safeArea.top + 20; // Ensure bubble is below safe area
      const maxY = screenHeight - bubbleHeight - safeArea.bottom; // Respect safe area bottom
      const clamped = {
        x: Math.max(minX, Math.min(position.x, maxX)),
        y: Math.max(minY, Math.min(position.y, maxY)),
      } as const;
      return clamped;
    },
    [visibleHandleWidth, bubbleHeight]
  );

  useEffect(() => {
    if (!enabled || isInitialized.current) return;
    const restore = async () => {
      const saved = await loadPosition();
      if (saved) {
        const validated = validatePosition(saved);
        // Check if the saved position is out of bounds
        const wasOutOfBounds =
          Math.abs(saved.x - validated.x) > 5 ||
          Math.abs(saved.y - validated.y) > 5;

        if (wasOutOfBounds) {
          // Save the corrected position
          await savePosition(validated.x, validated.y);
          debugLog("Adjusted out-of-bounds position", {
            original: saved,
            corrected: validated,
          });
        }

        animatedPosition.setValue(validated);
        debugLog("Restored persisted position", validated);
      } else {
        const { width: screenWidth, height: screenHeight } =
          Dimensions.get("window");
        const safeArea = getSafeAreaInsets();
        const defaultY = Math.max(
          safeArea.top + 20,
          Math.min(100, screenHeight - bubbleHeight - safeArea.bottom)
        );
        animatedPosition.setValue({
          x: screenWidth - bubbleWidth - 20,
          y: defaultY, // Ensure it's within safe area bounds
        });
        debugLog("Using default position", {
          x: screenWidth - bubbleWidth - 20,
          y: defaultY,
        });
      }
      isInitialized.current = true;
    };
    restore();
  }, [
    enabled,
    animatedPosition,
    loadPosition,
    validatePosition,
    savePosition,
    bubbleWidth,
    bubbleHeight,
  ]);

  useEffect(() => {
    if (!enabled || !isInitialized.current || listenersSuspended) return;
    const listener = animatedPosition.addListener((value) => {
      debouncedSavePosition(value.x, value.y);
    });
    return () => {
      animatedPosition.removeListener(listener);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [enabled, listenersSuspended, animatedPosition, debouncedSavePosition]);

  return {
    savePosition,
    loadPosition,
    isInitialized: isInitialized.current,
  } as const;
}

// =============================
// UI-only leaf components
// =============================
export function Divider() {
  const dividerStyle: ViewStyle = {
    width: 1,
    height: 12,
    backgroundColor: gameUIColors.muted + "66",
    flexShrink: 0,
  };
  return <View style={dividerStyle} />;
}

function getUserStatusConfig(userRole: UserRole) {
  switch (userRole) {
    case "admin":
      return {
        label: "Admin",
        dotColor: gameUIColors.success,
        textColor: gameUIColors.success,
      };
    case "internal":
      return {
        label: "Internal",
        dotColor: gameUIColors.optional,
        textColor: gameUIColors.optional,
      };
    case "user":
    default:
      return {
        label: "User",
        dotColor: gameUIColors.muted,
        textColor: gameUIColors.secondary,
      };
  }
}

// Context to avoid brittle prop threading and keep API composable
const FloatingToolsContext = createContext<{ isDragging: boolean }>({
  isDragging: false,
});

export function UserStatus({
  userRole,
  onPress,
}: {
  userRole: UserRole;
  onPress?: () => void;
}) {
  const { isDragging } = useContext(FloatingToolsContext);
  const config = getUserStatusConfig(userRole);
  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexShrink: 0,
  };
  const dotStyle: ViewStyle = {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: config.dotColor,
    marginRight: 4,
  };
  const textStyle: TextStyle = {
    fontSize: 10,
    fontWeight: "500",
    color: config.textColor,
    letterSpacing: 0.3,
  };
  if (!onPress) {
    return (
      <View style={containerStyle}>
        <View style={dotStyle} />
        <Text style={textStyle}>{config.label}</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      disabled={isDragging}
      activeOpacity={0.85}
      style={containerStyle}
    >
      <View style={dotStyle} />
      <Text style={textStyle}>{config.label}</Text>
    </TouchableOpacity>
  );
}

// =============================
// Helpers
// =============================
function interleaveWithDividers(childrenArray: ReactNode[]): ReactNode[] {
  const result: ReactNode[] = [];
  childrenArray.forEach((child, index) => {
    if (child == null || child === false) return;
    result.push(child);
    if (index < childrenArray.length - 1)
      result.push(<Divider key={`divider-${index}`} />);
  });
  return result;
}

// =============================
// Main Component (presentation only)
// =============================
export type FloatingToolsProps = {
  enablePositionPersistence?: boolean;
  children?: ReactNode;
};

/**
 * FloatingTools - A draggable, resizable bubble for development tools
 *
 * This component provides a floating bubble interface that can contain various
 * development tools and controls. It features:
 * - Drag and drop positioning with boundary constraints
 * - Hide/show functionality by dragging to screen edge
 * - Position persistence across app restarts
 * - Safe area aware positioning
 * - Automatic divider insertion between child components
 *
 * @param props - Configuration for the floating tools
 * @param props.enablePositionPersistence - Whether to save/restore position (default: true)
 * @param props.children - Child components to render in the bubble
 *
 * @returns JSX.Element representing the floating tools bubble
 *
 * @example
 * ```typescript
 * <FloatingTools enablePositionPersistence={true}>
 *   <UserStatus userRole="admin" onPress={handleUserPress} />
 *   <ToolButton onPress={openSettings} />
 * </FloatingTools>
 * ```
 *
 * @performance Uses native driver animations for smooth positioning
 * @performance Implements efficient boundary checking and position validation
 * @performance Includes debounced position saving for optimal storage performance
 */
export function FloatingTools({
  enablePositionPersistence = true,
  children,
}: FloatingToolsProps) {
  // Animated position and drag state
  const animatedPosition = useRef(new Animated.ValueXY()).current;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bubbleSize, setBubbleSize] = useState({ width: 100, height: 32 });
  const [isHidden, setIsHidden] = useState(false);

  // Store the position before hiding to restore when showing
  const savedPositionRef = useRef<{ x: number; y: number } | null>(null);

  const safeAreaInsets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // Position persistence (state/IO extracted to hook)
  const { savePosition } = useFloatingToolsPosition({
    animatedPosition,
    bubbleWidth: bubbleSize.width,
    bubbleHeight: bubbleSize.height,
    enabled: enablePositionPersistence,
    visibleHandleWidth: 32,
    listenersSuspended: isDragging,
  });

  // Check if bubble is in hidden position on load
  useEffect(() => {
    if (!enablePositionPersistence) return;

    const checkHiddenState = () => {
      const currentX = (
        animatedPosition.x as Animated.Value & { __getValue(): number }
      ).__getValue();
      // Check if bubble is at the hidden position (showing only grabber)
      if (currentX >= screenWidth - 32 - 5) {
        setIsHidden(true);
      }
    };
    // Delay check to ensure position is loaded
    const timer = setTimeout(checkHiddenState, 100);
    return () => clearTimeout(timer);
  }, [enablePositionPersistence, animatedPosition, screenWidth]);

  // Default position when persistence disabled
  useEffect(() => {
    if (!enablePositionPersistence) {
      const defaultY = Math.max(
        safeAreaInsets.top + 20,
        Math.min(100, screenHeight - bubbleSize.height - safeAreaInsets.bottom)
      );
      animatedPosition.setValue({
        x: screenWidth - bubbleSize.width - 20,
        y: defaultY,
      });
    }
  }, [
    enablePositionPersistence,
    animatedPosition,
    bubbleSize.width,
    bubbleSize.height,
    safeAreaInsets.top,
    safeAreaInsets.bottom,
    screenWidth,
    screenHeight,
  ]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Toggle hide/show function
  const toggleHideShow = useCallback(() => {
    const currentX = (
      animatedPosition.x as Animated.Value & { __getValue(): number }
    ).__getValue();
    const currentY = (
      animatedPosition.y as Animated.Value & { __getValue(): number }
    ).__getValue();

    if (isHidden) {
      // Show the bubble - restore to saved position or default visible position
      let targetX: number;
      let targetY: number;

      if (savedPositionRef.current) {
        // Restore to the saved position
        targetX = savedPositionRef.current.x;
        targetY = savedPositionRef.current.y;
      } else {
        // Default visible position if no saved position
        targetX = screenWidth - bubbleSize.width - 20;
        targetY = currentY;
      }

      setIsHidden(false);
      Animated.timing(animatedPosition, {
        toValue: { x: targetX, y: targetY },
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        savePosition(targetX, targetY);
      });
    } else {
      // Hide the bubble - save current position before hiding
      savedPositionRef.current = { x: currentX, y: currentY };

      const hiddenX = screenWidth - 32; // Only show the 32px grabber
      setIsHidden(true);
      Animated.timing(animatedPosition, {
        toValue: { x: hiddenX, y: currentY },
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        savePosition(hiddenX, currentY);
      });
    }
  }, [animatedPosition, isHidden, bubbleSize.width, savePosition, screenWidth]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (finalPosition: { x: number; y: number }) => {
      let { x: currentX, y: currentY } = finalPosition;

      // Check if bubble is more than 50% over the right edge
      const bubbleMidpoint = currentX + bubbleSize.width / 2;
      const shouldHide = bubbleMidpoint > screenWidth;

      debugLog("Drag ended", {
        finalPosition,
        shouldHide,
        bubbleMidpoint,
        screenWidth,
      });

      if (shouldHide) {
        // Animate to hidden position (only grabber visible)
        const hiddenX = screenWidth - 32; // Only show the 32px grabber
        setIsHidden(true);
        Animated.timing(animatedPosition, {
          toValue: { x: hiddenX, y: currentY },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          savePosition(hiddenX, currentY);
        });
      } else {
        // Check if we're in hidden state and user is pulling it back
        if (isHidden && currentX < screenWidth - 32 - 10) {
          setIsHidden(false);
        }

        // Update saved position if bubble is in visible area (not hidden)
        if (currentX < screenWidth - bubbleSize.width / 2) {
          savedPositionRef.current = { x: currentX, y: currentY };
        }

        savePosition(currentX, currentY);
      }
      setIsDragging(false);
    },
    [animatedPosition, bubbleSize.width, isHidden, savePosition, screenWidth]
  );

  // Stable styles
  const bubbleStyle: Animated.WithAnimatedObject<ViewStyle> = useMemo(
    () => ({
      position: "absolute",
      zIndex: 1001,
      transform: animatedPosition.getTranslateTransform(),
    }),
    [animatedPosition]
  );

  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: gameUIColors.panel,
    borderRadius: 6,
    borderWidth: isDragging ? 2 : 1,
    borderColor: isDragging ? gameUIColors.info : gameUIColors.muted + "66",
    overflow: "hidden",
    elevation: 8,
    shadowColor: isDragging ? gameUIColors.info + "99" : "#000",
    shadowOffset: { width: 0, height: isDragging ? 6 : 4 },
    shadowOpacity: isDragging ? 0.6 : 0.3,
    shadowRadius: isDragging ? 12 : 8,
  };

  const dragHandleStyle: ViewStyle = {
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: gameUIColors.muted + "1A",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    borderRightWidth: 1,
    borderRightColor: gameUIColors.muted + "66",
  };

  const contentStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  };

  // Compose actions row with automatic dividers
  const actions = useMemo(
    () => interleaveWithDividers(Children.toArray(children)),
    [children]
  );

  return (
    <Animated.View style={bubbleStyle}>
      <View
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={containerStyle}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setBubbleSize({ width, height });
        }}
      >
        <DraggableHeader
          position={animatedPosition}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTap={toggleHideShow}
          containerBounds={{ width: screenWidth, height: screenHeight }}
          elementSize={bubbleSize}
          minPosition={{
            x: safeAreaInsets.left,
            y: safeAreaInsets.top + 20,
          }}
          style={dragHandleStyle}
          enabled={true}
          maxOverflowX={bubbleSize.width}
        >
          <GripVerticalIcon size={12} color={gameUIColors.secondary + "CC"} />
        </DraggableHeader>
        <FloatingToolsContext.Provider value={{ isDragging }}>
          <View style={contentStyle}>{actions}</View>
        </FloatingToolsContext.Provider>
      </View>
    </Animated.View>
  );
}
