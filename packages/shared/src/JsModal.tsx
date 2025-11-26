/**
 * JsModal - Ultra-optimized for true 60FPS performance
 *
 * Achieves 60FPS by following the principles from the dial menu:
 * 1. ALWAYS use native driver (useNativeDriver: true)
 * 2. Use transforms instead of layout properties (translateY instead of height)
 * 3. Use interpolation for all calculations (no JS thread math)
 * 4. Minimize PanResponder JS work (direct setValue, no state updates)
 *
 * Structure follows SRP with each function doing ONE thing only.
 */

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  memo,
  isValidElement,
  cloneElement,
  ReactElement,
  ReactNode,
  FC,
} from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  PanResponder,
  Animated,
  ScrollView,
  Text,
  ViewStyle,
  GestureResponderHandlers,
} from "react-native";
import { useSafeAreaInsets } from "./hooks/useSafeAreaInsets";
import { gameUIColors } from "./ui/gameUI";
import {
  DraggableHeader,
  ModalHintBanner,
  WindowControls,
} from "./ui/components";
import { safeGetItem, safeSetItem } from "./utils/safeAsyncStorage";
import { devToolsStorageKeys } from "./storage/devToolsStorageKeys";
import { useHintsDisabled } from "./context";
// ============================================================================
// CONSTANTS - Modal dimensions and configuration
// ============================================================================
const SCREEN = Dimensions.get("window");
const MIN_HEIGHT = 100;
const DEFAULT_HEIGHT = 400;
const FLOATING_WIDTH = SCREEN.width; // Full width
const FLOATING_HEIGHT = 500;
const FLOATING_MIN_WIDTH = SCREEN.width * 0.25; // 1/4 of screen width
const FLOATING_MIN_HEIGHT = 80; // Just a bit more than header height (60px header + 20px content)

// ============================================================================
// STORAGE - Modal state persistence with AsyncStorage
// ============================================================================
interface PersistedModalState {
  mode?: ModalMode;
  panelHeight?: number;
  dimensions?: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  isVisible?: boolean;
}

/**
 * Utility class for persisting modal state to AsyncStorage
 *
 * Handles saving and loading modal state including mode, dimensions,
 * and position with memory caching for performance.
 */
class ModalStorage {
  private static memoryCache: Record<string, PersistedModalState> = {};

  /**
   * Save modal state to AsyncStorage with memory caching
   *
   * @param key - Storage key for the modal state
   * @param value - Modal state to persist
   */
  static async save(key: string, value: PersistedModalState): Promise<void> {
    try {
      this.memoryCache[key] = value;
      await safeSetItem(key, JSON.stringify(value));
    } catch (error) {
      // Failed to save modal state
    }
  }

  /**
   * Load modal state from AsyncStorage with memory cache fallback
   *
   * @param key - Storage key for the modal state
   * @returns Persisted modal state or null if not found
   */
  static async load(key: string): Promise<PersistedModalState | null> {
    try {
      // Try memory cache first
      if (this.memoryCache[key]) {
        return this.memoryCache[key];
      }

      // Load from storage (AsyncStorage or memory fallback)
      const stored = await safeGetItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.memoryCache[key] = parsed;
        return parsed;
      }
    } catch (error) {
      // Failed to load modal state
    }
    return null;
  }
}

// ============================================================================
// TYPE DEFINITIONS - Interface contracts for the modal
// ============================================================================
export type ModalMode = "bottomSheet" | "floating";

interface HeaderConfig {
  title?: string;
  subtitle?: string;
  showToggleButton?: boolean;
  customContent?: ReactNode;
  hideCloseButton?: boolean;
  hideMinimizeButton?: boolean;
}

interface CustomStyles {
  container?: ViewStyle;
  content?: ViewStyle;
}

/**
 * Modal state that can be saved and restored when minimizing/restoring
 */
export interface ModalState {
  mode: ModalMode;
  panelHeight?: number;
  floatingPosition?: { x: number; y: number };
  floatingDimensions?: { width: number; height: number };
}

interface JsModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: HeaderConfig;
  styles?: CustomStyles;
  minHeight?: number;
  maxHeight?: number;
  initialHeight?: number;
  animatedHeight?: Animated.Value; // External animated height for performance testing
  initialMode?: ModalMode;
  onModeChange?: (mode: ModalMode) => void;
  persistenceKey?: string;
  enablePersistence?: boolean;
  enableGlitchEffects?: boolean;
  initialFloatingPosition?: { x?: number; y?: number }; // Initial position for floating mode
  // New: Optional sticky footer rendered outside internal ScrollView
  footer?: ReactNode;
  footerHeight?: number; // Used to pad ScrollView content bottom
  onBack?: () => void; // Callback for back button - enables tap detection on top-left corner
  /** Callback when minimize is requested - receives current modal state for restoration */
  onMinimize?: (modalState: ModalState) => void;
  /** Target position for minimize animation (where the icon will appear) */
  minimizeTargetPosition?: { x: number; y: number };
  /** Initial modal state to restore from (when restoring from minimized) */
  initialModalState?: ModalState;
  /** z-index for stacking multiple modals (higher = on top) */
  zIndex?: number;
}

// ============================================================================
// ICON COMPONENTS - Visual indicators for modal controls
// ============================================================================

/**
 * DragIndicator - Visual feedback for draggable areas
 */
const DragIndicator = memo(function DragIndicator({
  isResizing,
  mode,
  hasCustomContent = false,
}: {
  isResizing: boolean;
  mode: ModalMode;
  hasCustomContent?: boolean;
}) {
  return (
    <View
      style={[
        styles.dragIndicatorContainer,
        hasCustomContent && styles.dragIndicatorContainerCustom,
      ]}
    >
      {/* Show drag indicator in both modes */}
      <View
        style={[
          styles.dragIndicator,
          mode === "floating" && styles.floatingDragIndicator,
          isResizing && styles.dragIndicatorActive,
        ]}
      />
      {/* Add resize grip lines for better visual feedback in bottom sheet */}
      {isResizing && mode === "bottomSheet" && (
        <View style={styles.resizeGripContainer}>
          <View style={styles.resizeGripLine} />
          <View style={styles.resizeGripLine} />
          <View style={styles.resizeGripLine} />
        </View>
      )}
    </View>
  );
});

/**
 * CornerHandle - Resize handle for floating mode corners
 */
const CornerHandle = memo(function CornerHandle({
  position,
  isActive,
}: {
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  isActive: boolean;
}) {
  return (
    <View style={[styles.cornerHandle]}>
      <View style={[styles.handler, isActive && styles.handlerActive]} />
    </View>
  );
});

/**
 * ModalHeader - Header bar with title, controls, and drag area
 */
interface ModalHeaderProps {
  header?: HeaderConfig;
  onClose: () => void;
  onToggleMode: () => void;
  onMinimize?: () => void;
  isResizing: boolean;
  mode: ModalMode;
  panHandlers?: GestureResponderHandlers;
}

const ModalHeader = memo(function ModalHeader({
  header,
  onClose,
  onToggleMode,
  onMinimize,
  isResizing,
  mode,
  panHandlers,
}: ModalHeaderProps) {
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHeaderTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    // Reset tap count if more than 500ms since last tap
    if (timeSinceLastTap > 500) {
      tapCountRef.current = 0;
    }

    tapCountRef.current++;
    lastTapRef.current = now;

    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Set timeout to process the tap gesture
    tapTimeoutRef.current = setTimeout(() => {
      if (tapCountRef.current === 2) {
        // Double tap - toggle mode
        onToggleMode();
      } else if (tapCountRef.current >= 3) {
        // Triple tap - minimize modal (if available)
        if (onMinimize) {
          onMinimize();
        }
      }
      tapCountRef.current = 0;
    }, 300);
  }, [onToggleMode, onMinimize]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const headerProps = panHandlers ? panHandlers : {};
  // Disable tap handling when no panHandlers (i.e., when using DraggableHeader in floating mode)
  const shouldHandleTap = !!panHandlers;

  // If custom content is provided, check if it's a complete replacement
  if (header?.customContent) {
    // Check if the custom content is a complete header replacement (like CyberpunkModalHeader)
    // by checking if it's a React element with specific props
    const isCompleteReplacement =
      isValidElement(header.customContent) &&
      typeof header.customContent.type === "function" &&
      header.customContent.type.name === "CyberpunkModalHeader";

    if (isCompleteReplacement) {
      // Clone the element and pass the necessary props
      return cloneElement(
        header.customContent as ReactElement<any>,
        {
          onToggleMode,
          onClose,
          mode,
          panHandlers: headerProps,
          showToggleButton: header?.showToggleButton !== false,
          hideCloseButton: header?.hideCloseButton,
        } as any
      );
    }

    // Otherwise, render custom content within the standard header structure
    // Apply pan handlers to the outer View for dragging in floating mode
    // If the custom content is a React element, inject onMinimize so it can trigger minimize
    let customContentWithMinimize = header.customContent;
    if (isValidElement(header.customContent) && onMinimize) {
      customContentWithMinimize = cloneElement(
        header.customContent as ReactElement<any>,
        { onMinimize } as any
      );
    }

    const headerContent = (
      <View style={styles.headerInner}>
        <DragIndicator
          isResizing={isResizing}
          mode={mode}
          hasCustomContent={true}
        />
        {customContentWithMinimize}
      </View>
    );

    return (
      <View style={styles.header} {...headerProps}>
        {shouldHandleTap ? (
          <TouchableWithoutFeedback onPress={handleHeaderTap}>
            {headerContent}
          </TouchableWithoutFeedback>
        ) : (
          headerContent
        )}
      </View>
    );
  }

  const headerContent = (
    <View style={styles.headerInner}>
      <DragIndicator isResizing={isResizing} mode={mode} />
      <View style={styles.headerContent}>
        {header?.title && (
          <Text style={styles.headerTitle}>{header.title}</Text>
        )}
        {header?.subtitle && (
          <Text style={styles.headerSubtitle}>{header.subtitle}</Text>
        )}
      </View>
      <View style={styles.headerHintText}>
        <Text style={styles.hintText}>
          Double tap: Toggle • Triple tap: Close
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[styles.header, mode === "floating" && styles.floatingModeHeader]}
      {...headerProps}
    >
      {shouldHandleTap ? (
        <TouchableWithoutFeedback onPress={handleHeaderTap}>
          {headerContent}
        </TouchableWithoutFeedback>
      ) : (
        headerContent
      )}
    </View>
  );
});

// ============================================================================
// MAIN COMPONENT - Optimized for 60FPS with transforms and interpolation
// ============================================================================
/**
 * JsModal - Ultra-optimized modal component for true 60FPS performance
 *
 * This modal component is designed for maximum performance using native driver
 * animations, transforms instead of layout properties, and minimal JavaScript
 * thread work. It supports two modes: bottom sheet and floating window.
 *
 * Key Performance Features:
 * - Uses native driver for all animations (useNativeDriver: true)
 * - Transform-based positioning instead of layout changes
 * - Interpolation for all calculations on the native thread
 * - Minimal PanResponder JavaScript work
 * - State persistence with AsyncStorage
 * - Drag and resize functionality in both modes
 *
 * @param props - Modal configuration and content
 * @returns JSX.Element representing the modal
 *
 * @example
 * ```typescript
 * <JsModal
 *   visible={isVisible}
 *   onClose={() => setVisible(false)}
 *   header={{
 *     title: "Settings",
 *     subtitle: "Configure your preferences"
 *   }}
 *   persistenceKey="settings-modal"
 *   enablePersistence={true}
 * >
 *   <SettingsContent />
 * </JsModal>
 * ```
 *
 * @performance All animations use native driver for 60FPS performance
 * @performance Uses transform-based positioning for optimal rendering
 * @performance Includes state persistence and restoration capabilities
 */
const JsModalComponent: FC<JsModalProps> = ({
  visible,
  onClose,
  children,
  header,
  styles: customStyles = {},
  minHeight = MIN_HEIGHT,
  maxHeight,
  initialHeight = DEFAULT_HEIGHT,
  animatedHeight: externalAnimatedHeight,
  initialMode = "bottomSheet",
  onModeChange,
  persistenceKey,
  enablePersistence = true,
  initialFloatingPosition,
  footer,
  footerHeight = 0,
  onBack,
  onMinimize,
  minimizeTargetPosition,
  initialModalState,
  zIndex,
}) => {
  const insets = useSafeAreaInsets();
  const [isStateLoaded, setIsStateLoaded] = useState(!enablePersistence);
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [panelHeight, setPanelHeight] = useState(initialHeight);
  const [dimensions, setDimensions] = useState({
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
    top: (SCREEN.height - FLOATING_HEIGHT) / 2,
    left: 0, // Flush with left edge
  });
  const [containerBounds] = useState({
    width: SCREEN.width,
    height: SCREEN.height,
  });
  const [showHint, setShowHint] = useState(false);
  const [hintLoaded, setHintLoaded] = useState(false);
  const hintsDisabled = useHintsDisabled();

  // ============================================================================
  // ANIMATED VALUES - All using native driver
  // ============================================================================

  // Main visibility progress (0 = hidden, 1 = visible)
  const visibilityProgress = useRef(new Animated.Value(0)).current;

  // Bottom sheet specific - using translateY for performance!
  const bottomSheetTranslateY = useRef(
    new Animated.Value(SCREEN.height)
  ).current;
  const dragOffset = useRef(new Animated.Value(0)).current;

  // Height tracking for resize - actual position from bottom
  const animatedBottomPosition = useRef(
    new Animated.Value(initialHeight)
  ).current;
  const currentHeightRef = useRef(initialHeight);

  // Save state with debounce
  useEffect(() => {
    if (!enablePersistence || !persistenceKey || !isStateLoaded) return;

    const timeoutId = setTimeout(() => {
      ModalStorage.save(persistenceKey, {
        mode,
        panelHeight: currentHeightRef.current,
        dimensions,
        isVisible: visible,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    mode,
    panelHeight,
    dimensions,
    visible,
    persistenceKey,
    enablePersistence,
    isStateLoaded,
  ]);

  // Sync with external height if provided
  useEffect(() => {
    // Height sync effect
    if (externalAnimatedHeight && !isResizing) {
      currentHeightRef.current = initialHeight;
      externalAnimatedHeight.setValue(initialHeight);
      // Set external height
    }
  }, [externalAnimatedHeight, initialHeight, isResizing]);

  // Update refs when dimensions change
  useEffect(() => {
    currentDimensionsRef.current = dimensions;
  }, [dimensions]);

  // Floating mode animations - use initialFloatingPosition if provided
  const floatingPosition = useRef(
    new Animated.ValueXY({
      x: initialFloatingPosition?.x ?? 0, // Flush with left edge
      y: initialFloatingPosition?.y ?? (SCREEN.height - FLOATING_HEIGHT) / 2,
    })
  ).current;
  const floatingScale = useRef(new Animated.Value(0)).current;
  const animatedWidth = useRef(new Animated.Value(FLOATING_WIDTH)).current;
  const animatedFloatingHeight = useRef(
    new Animated.Value(FLOATING_HEIGHT)
  ).current;

  // Refs for resize handles
  const currentDimensionsRef = useRef(dimensions);
  const startDimensionsRef = useRef(dimensions);
  const offsetX = useRef(0);
  const offsetY = useRef(0);
  const sHeight = useRef(0);
  const sWidth = useRef(0);

  // Load hint acknowledgment status on mount
  useEffect(() => {
    let mounted = true;
    const loadHintStatus = async () => {
      try {
        const hintKey = devToolsStorageKeys.modal.hintAcknowledged();
        const acknowledged = await safeGetItem(hintKey);
        if (mounted) {
          // Show hint if not acknowledged yet
          setShowHint(acknowledged !== "true");
          setHintLoaded(true);
        }
      } catch (error) {
        // Failed to load hint status, default to showing hint
        if (mounted) {
          setShowHint(true);
          setHintLoaded(true);
        }
      }
    };

    loadHintStatus();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle hint acknowledgment
  const handleHintAcknowledge = useCallback(async () => {
    try {
      const hintKey = devToolsStorageKeys.modal.hintAcknowledged();
      await safeSetItem(hintKey, "true");
      setShowHint(false);
    } catch (error) {
      // Failed to save hint acknowledgment, just hide it locally
      setShowHint(false);
    }
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    if (!enablePersistence || !persistenceKey) {
      setIsStateLoaded(true);
      return;
    }

    let mounted = true;
    const loadState = async () => {
      const savedState = await ModalStorage.load(persistenceKey);
      if (mounted && savedState) {
        // Restore mode
        if (savedState.mode) {
          setMode(savedState.mode);
          // Notify parent of loaded mode
          onModeChange?.(savedState.mode);
        }

        // Restore bottom sheet height
        if (savedState.panelHeight) {
          setPanelHeight(savedState.panelHeight);
          currentHeightRef.current = savedState.panelHeight;
          animatedBottomPosition.setValue(savedState.panelHeight);
        }

        // Restore floating dimensions and position
        if (savedState.dimensions) {
          setDimensions(savedState.dimensions);
          floatingPosition.setValue({
            x: savedState.dimensions.left,
            y: savedState.dimensions.top,
          });
          animatedWidth.setValue(savedState.dimensions.width);
          animatedFloatingHeight.setValue(savedState.dimensions.height);
        }
      }
      if (mounted) setIsStateLoaded(true);
    };

    loadState();
    return () => {
      mounted = false;
    };
  }, [
    persistenceKey,
    enablePersistence,
    onModeChange,
    animatedBottomPosition,
    animatedFloatingHeight,
    animatedWidth,
    floatingPosition,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    // Mount/Unmount effect
    return () => {
      // Stop all animations and reset when component unmounts
      visibilityProgress.stopAnimation();
      bottomSheetTranslateY.stopAnimation();
      floatingScale.stopAnimation();
      dragOffset.stopAnimation();
      animatedBottomPosition.stopAnimation();
      floatingPosition.stopAnimation();
      animatedWidth.stopAnimation();
      animatedFloatingHeight.stopAnimation();

      // Reset to initial values
      visibilityProgress.setValue(0);
      bottomSheetTranslateY.setValue(SCREEN.height);
      floatingScale.setValue(0);
      dragOffset.setValue(0);
      animatedBottomPosition.setValue(initialHeight);
      currentHeightRef.current = initialHeight;
    };
  }, []);

  // ============================================================================
  // INTERPOLATIONS - All math done natively!
  // ============================================================================

  // Opacity interpolation for smooth fade
  const modalOpacity = visibilityProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // ============================================================================
  // REFS for values we need to track
  // ============================================================================
  const isExternallyControlled = !!externalAnimatedHeight;
  const effectiveMaxHeight = maxHeight || SCREEN.height - insets.top;

  // Mode toggle handler
  /**
   * Toggle between bottom sheet and floating modal modes
   *
   * Clears active dragging and resizing states to prevent visual artifacts
   * when switching between modes with different interaction patterns.
   */
  const toggleMode = useCallback(() => {
    // Avoid carrying active styling across modes
    setIsDragging(false);
    setIsResizing(false);

    const newMode = mode === "bottomSheet" ? "floating" : "bottomSheet";
    setMode(newMode);
    onModeChange?.(newMode);
  }, [mode, onModeChange]);

  // Belt-and-suspenders: also clear flags when mode changes
  useEffect(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, [mode]);

  // Minimize handler - captures current state and animates out
  const handleMinimize = useCallback(() => {
    if (!onMinimize) return;

    // Capture current modal state for restoration
    const currentState: ModalState = {
      mode,
      panelHeight: currentHeightRef.current,
      floatingPosition: {
        x: currentDimensionsRef.current.left,
        y: currentDimensionsRef.current.top,
      },
      floatingDimensions: {
        width: currentDimensionsRef.current.width,
        height: currentDimensionsRef.current.height,
      },
    };

    // Animate modal shrinking toward target position
    const targetX = minimizeTargetPosition?.x ?? SCREEN.width - 50;
    const targetY = minimizeTargetPosition?.y ?? SCREEN.height - 150;

    // Calculate animation based on current mode
    if (mode === "bottomSheet") {
      // Animate bottom sheet shrinking and moving toward target
      Animated.parallel([
        Animated.timing(visibilityProgress, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bottomSheetTranslateY, {
          toValue: SCREEN.height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onMinimize(currentState);
      });
    } else {
      // Floating mode - animate scale and position toward icon
      Animated.parallel([
        Animated.timing(floatingScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(visibilityProgress, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(floatingPosition, {
          toValue: { x: targetX, y: targetY },
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onMinimize(currentState);
      });
    }
  }, [
    mode,
    onMinimize,
    minimizeTargetPosition,
    visibilityProgress,
    bottomSheetTranslateY,
    floatingScale,
    floatingPosition,
  ]);

  // Apply initial modal state when restoring from minimized
  useEffect(() => {
    if (!initialModalState) return;

    // Restore mode
    if (initialModalState.mode) {
      setMode(initialModalState.mode);
      onModeChange?.(initialModalState.mode);
    }

    // Restore bottom sheet height
    if (initialModalState.panelHeight) {
      setPanelHeight(initialModalState.panelHeight);
      currentHeightRef.current = initialModalState.panelHeight;
      animatedBottomPosition.setValue(initialModalState.panelHeight);
    }

    // Restore floating dimensions and position
    if (
      initialModalState.floatingDimensions &&
      initialModalState.floatingPosition
    ) {
      const newDimensions = {
        width: initialModalState.floatingDimensions.width,
        height: initialModalState.floatingDimensions.height,
        top: initialModalState.floatingPosition.y,
        left: initialModalState.floatingPosition.x,
      };
      setDimensions(newDimensions);
      floatingPosition.setValue({
        x: initialModalState.floatingPosition.x,
        y: initialModalState.floatingPosition.y,
      });
      animatedWidth.setValue(initialModalState.floatingDimensions.width);
      animatedFloatingHeight.setValue(
        initialModalState.floatingDimensions.height
      );
    }
  }, [initialModalState]);

  // ============================================================================
  // EFFECT: Visibility Animations - All using native driver!
  // ============================================================================
  useEffect(() => {
    // Visibility effect
    let openAnimation: Animated.CompositeAnimation | null = null;
    let closeAnimation: Animated.CompositeAnimation | null = null;

    if (visible) {
      // Reset position if needed and then open
      bottomSheetTranslateY.setValue(SCREEN.height);
      visibilityProgress.setValue(0);

      // Open animations
      if (mode === "bottomSheet") {
        // Parallel animations for smooth opening
        openAnimation = Animated.parallel([
          // Slide up from bottom
          Animated.spring(bottomSheetTranslateY, {
            toValue: 0,
            tension: 180,
            friction: 22,
            useNativeDriver: true,
          }),
          // Fade in backdrop
          Animated.timing(visibilityProgress, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]);
        openAnimation.start();
      } else {
        // Floating mode entrance - simple fade without scale pop
        floatingScale.setValue(1); // Set scale to 1 directly, no animation
        openAnimation = Animated.timing(visibilityProgress, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        });
        openAnimation.start();
      }
    } else {
      // Close animations
      if (mode === "bottomSheet") {
        closeAnimation = Animated.parallel([
          // Slide down
          Animated.spring(bottomSheetTranslateY, {
            toValue: SCREEN.height,
            tension: 180,
            friction: 22,
            useNativeDriver: true,
          }),
          // Fade out backdrop
          Animated.timing(visibilityProgress, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]);
        closeAnimation.start();
      } else {
        // Floating mode exit - simple fade without scale
        closeAnimation = Animated.timing(visibilityProgress, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        });
        closeAnimation.start();
      }
    }

    // Cleanup function - only stop animations, don't reset values
    return () => {
      // Cleanup animations
      if (openAnimation) {
        openAnimation.stop();
        // Stopped open animation
      }
      if (closeAnimation) {
        closeAnimation.stop();
        // Stopped close animation
      }
    };
  }, [
    visible,
    mode,
    visibilityProgress,
    bottomSheetTranslateY,
    floatingScale,
    externalAnimatedHeight,
  ]); // Removed initialHeight to prevent animation restarts on height changes

  // ============================================================================
  // OPTIMIZED PAN RESPONDER: Bottom Sheet Resize
  // Following the documentation pattern for proper resize
  // ============================================================================
  const headerTouchOffsetRef = useRef(0);

  const bottomSheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          !isExternallyControlled && mode === "bottomSheet",
        onMoveShouldSetPanResponder: (evt, gestureState) =>
          !isExternallyControlled &&
          mode === "bottomSheet" &&
          Math.abs(gestureState.dy) > 3,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          setIsResizing(true);

          // Where inside the header the finger grabbed
          headerTouchOffsetRef.current = evt.nativeEvent.locationY || 0;

          // Stop any in-flight animations so we start from truth
          animatedBottomPosition.stopAnimation((val: number) => {
            currentHeightRef.current = val;
          });
          bottomSheetTranslateY.stopAnimation();
        },

        onPanResponderMove: (evt) => {
          // Absolute finger anchoring: sheet top should match finger (minus header offset)
          const sheetTop = evt.nativeEvent.pageY - headerTouchOffsetRef.current;
          // Height is from bottom of screen to sheetTop
          let targetHeight = SCREEN.height - sheetTop;

          // Clamp
          targetHeight = Math.max(
            minHeight,
            Math.min(targetHeight, effectiveMaxHeight)
          );

          // Push to UI (no React state!)
          animatedBottomPosition.setValue(targetHeight);
          currentHeightRef.current = targetHeight;
          if (externalAnimatedHeight) {
            externalAnimatedHeight.setValue(targetHeight);
          }
        },

        onPanResponderRelease: (evt, gestureState) => {
          setIsResizing(false);

          const finalHeight = currentHeightRef.current;

          // Optional: close with fast downward swipe
          const shouldClose =
            (gestureState.vy > 0.8 && gestureState.dy > 50) ||
            (gestureState.dy > 150 && finalHeight <= minHeight);

          if (shouldClose) {
            Animated.parallel([
              Animated.timing(visibilityProgress, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(bottomSheetTranslateY, {
                toValue: SCREEN.height,
                tension: 180,
                friction: 22,
                useNativeDriver: true,
              }),
            ]).start(() => onClose());
            return;
          }

          // We're already at the finger-tracked height; avoid re-animating it.
          setPanelHeight(finalHeight);
          if (externalAnimatedHeight)
            externalAnimatedHeight.setValue(finalHeight);
        },

        onPanResponderTerminate: () => {
          setIsResizing(false);
          // snap back to the last stable height if you want; otherwise no-op
        },
      }),
    [
      mode,
      isExternallyControlled,
      minHeight,
      effectiveMaxHeight,
      animatedBottomPosition,
      externalAnimatedHeight,
      bottomSheetTranslateY,
      visibilityProgress,
      onClose,
    ]
  );

  // ============================================================================
  // CREATE RESIZE HANDLER: For 4-corner resize in floating mode (fixed geometry)
  // ============================================================================
  /**
   * Create a PanResponder for handling corner-based resizing in floating mode
   *
   * This function generates resize handlers for each corner that allow users to
   * resize the floating modal by dragging from any corner. It includes boundary
   * checking and minimum size constraints.
   *
   * @param corner - Which corner this handler is for
   * @returns PanResponder configured for that corner's resize behavior
   *
   * @performance Uses direct animated value updates for smooth resizing
   * @performance Includes safe area boundary checking for all corners
   */
  const createResizeHandler = useCallback(
    (corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight") => {
      let didResize = false;

      return PanResponder.create({
        onStartShouldSetPanResponder: () => mode === "floating",
        onMoveShouldSetPanResponder: () => mode === "floating",
        onPanResponderGrant: () => {
          didResize = false;
          const currentDims = currentDimensionsRef.current;

          // If any animation is in-flight, stop and capture final XY to keep math consistent
          floatingPosition.stopAnimation(
            ({ x, y }: { x: number; y: number }) => {
              floatingPosition.setValue({ x, y });
            }
          );

          setIsResizing(true);
          // Snapshot starting rect
          startDimensionsRef.current = { ...currentDims };

          // Keep your existing refs up-to-date (not strictly needed now, but harmless)
          sHeight.current = currentDims.height;
          sWidth.current = currentDims.width;
          offsetX.current = currentDims.left;
          offsetY.current = currentDims.top;
        },

        onPanResponderMove: (_evt, gestureState) => {
          const { dx, dy } = gestureState;
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

          didResize = true;
          // Safe-area–aware bounds
          const minLeft = Math.max(0, insets.left || 0);
          const maxRight =
            containerBounds.width - Math.max(0, insets.right || 0);
          const minTop = Math.max(0, insets.top || 0);
          const maxBottom =
            containerBounds.height - Math.max(0, insets.bottom || 0);

          const start = startDimensionsRef.current;
          const startRight = start.left + start.width;
          const startBottom = start.top + start.height;

          let left = start.left;
          let top = start.top;
          let right = startRight;
          let bottom = startBottom;

          switch (corner) {
            case "topLeft": {
              // Move left & top; anchor right & bottom
              const newLeft = Math.max(
                minLeft,
                Math.min(start.left + dx, startRight - FLOATING_MIN_WIDTH)
              );
              const newTop = Math.max(
                minTop,
                Math.min(start.top + dy, startBottom - FLOATING_MIN_HEIGHT)
              );
              left = newLeft;
              top = newTop;
              right = startRight;
              bottom = startBottom;
              break;
            }
            case "topRight": {
              // Move right & top; anchor left & bottom
              const newRight = Math.min(
                maxRight,
                Math.max(startRight + dx, start.left + FLOATING_MIN_WIDTH)
              );
              const newTop = Math.max(
                minTop,
                Math.min(start.top + dy, startBottom - FLOATING_MIN_HEIGHT)
              );
              left = start.left;
              top = newTop;
              right = newRight;
              bottom = startBottom;
              break;
            }
            case "bottomLeft": {
              // Move left & bottom; anchor right & top
              const newLeft = Math.max(
                minLeft,
                Math.min(start.left + dx, startRight - FLOATING_MIN_WIDTH)
              );
              const newBottom = Math.min(
                maxBottom,
                Math.max(startBottom + dy, start.top + FLOATING_MIN_HEIGHT)
              );
              left = newLeft;
              top = start.top;
              right = startRight;
              bottom = newBottom;
              break;
            }
            case "bottomRight": {
              // Move right & bottom; anchor left & top
              const newRight = Math.min(
                maxRight,
                Math.max(startRight + dx, start.left + FLOATING_MIN_WIDTH)
              );
              const newBottom = Math.min(
                maxBottom,
                Math.max(startBottom + dy, start.top + FLOATING_MIN_HEIGHT)
              );
              left = start.left;
              top = start.top;
              right = newRight;
              bottom = newBottom;
              break;
            }
          }

          // Derive width/height from the edges
          const updatedWidth = Math.max(FLOATING_MIN_WIDTH, right - left);
          const updatedHeight = Math.max(FLOATING_MIN_HEIGHT, bottom - top);

          // Push to UI
          setDimensions({
            width: updatedWidth,
            height: updatedHeight,
            left,
            top,
          });

          // Keep animated values in sync for your transforms
          animatedWidth.setValue(updatedWidth);
          animatedFloatingHeight.setValue(updatedHeight);
          floatingPosition.setValue({ x: left, y: top });

          // Cache
          currentDimensionsRef.current = {
            width: updatedWidth,
            height: updatedHeight,
            left,
            top,
          };
        },

        onPanResponderRelease: () => {
          setIsResizing(false);
          didResize = false;
          // currentDimensionsRef already holds the last values
          setDimensions(currentDimensionsRef.current);
        },

        onPanResponderTerminate: () => {
          setIsResizing(false);
          didResize = false;
        },
      });
    },
    [
      mode,
      containerBounds,
      insets.left,
      insets.right,
      insets.top,
      insets.bottom,
      floatingPosition,
      animatedWidth,
      animatedFloatingHeight,
      onClose,
      onBack,
    ]
  );

  const resizeHandlers = useMemo(() => {
    return {
      topLeft: createResizeHandler("topLeft"),
      topRight: createResizeHandler("topRight"),
      bottomLeft: createResizeHandler("bottomLeft"),
      bottomRight: createResizeHandler("bottomRight"),
    };
  }, [createResizeHandler]);

  // ============================================================================
  // Floating Mode Drag Handlers for DraggableHeader
  // ============================================================================
  const handleFloatingDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleFloatingDragEnd = useCallback(
    (finalPosition: { x: number; y: number }) => {
      setIsDragging(false);

      // Update dimensions state to match final position
      const currentDims = currentDimensionsRef.current;
      const newDimensions = {
        ...currentDims,
        left: finalPosition.x,
        top: finalPosition.y,
      };
      setDimensions(newDimensions);
    },
    []
  );

  // Track taps for double/triple tap functionality
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFloatingTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    // Reset tap count if more than 500ms since last tap
    if (timeSinceLastTap > 500) {
      tapCountRef.current = 0;
    }

    tapCountRef.current++;
    lastTapRef.current = now;

    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Set timeout to process the tap gesture
    tapTimeoutRef.current = setTimeout(() => {
      if (tapCountRef.current === 2) {
        // Double tap - toggle mode
        toggleMode();
      } else if (tapCountRef.current >= 3) {
        // Triple tap - minimize modal (if available)
        if (onMinimize) {
          handleMinimize();
        }
      }
      tapCountRef.current = 0;
    }, 300);
  }, [toggleMode, onMinimize, handleMinimize]);

  // Clean up timeout on unmount for main component tap handler
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RENDER: Modal UI with transform-based animations
  // ============================================================================

  // When not visible, render off-screen to keep children mounted (preserves state/listeners)
  // This is similar to how React Navigation keeps screens mounted
  if (!visible) {
    return (
      <View
        style={styles.hiddenContainer}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </View>
    );
  }

  // Render floating mode
  if (mode === "floating") {
    return (
      <Animated.View
        nativeID="jsmodal-root"
        style={[
          styles.floatingModal,
          {
            width: dimensions.width, // Use state dimensions for real-time updates
            height: dimensions.height,
            opacity: modalOpacity,
            transform: [
              { translateX: floatingPosition.x },
              { translateY: floatingPosition.y },
            ],
            ...(zIndex !== undefined && { zIndex }),
          },
          (isDragging || isResizing) && styles.floatingModalDragging,
          customStyles.container,
        ]}
      >
        <DraggableHeader
          position={floatingPosition}
          onDragStart={handleFloatingDragStart}
          onDragEnd={handleFloatingDragEnd}
          onTap={handleFloatingTap}
          containerBounds={containerBounds}
          elementSize={dimensions}
          minPosition={{ x: 0, y: insets.top }}
          style={styles.floatingHeader}
          enabled={mode === "floating" && !isResizing}
        >
          <ModalHeader
            header={header}
            onClose={onClose}
            onToggleMode={toggleMode}
            onMinimize={onMinimize ? handleMinimize : undefined}
            isResizing={isDragging || isResizing}
            mode={mode}
          />
        </DraggableHeader>

        {/* macOS-style window controls - absolute positioned top-right */}
        <View style={styles.windowControlsContainer}>
          <WindowControls
            onClose={onClose}
            onMinimize={onMinimize ? handleMinimize : undefined}
            onToggleMode={toggleMode}
            mode={mode}
          />
        </View>

        <View style={[styles.content, customStyles.content]}>
          {/* Always wrap in ScrollView with nestedScrollEnabled for FlatList compatibility */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: footerHeight as number,
            }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {children}
          </ScrollView>
          {footer ? (
            <View style={footerStyles.footerContainer}>{footer}</View>
          ) : null}
        </View>

        {/* Corner resize handles - only bottom corners to avoid conflict with window controls */}
        <View
          {...resizeHandlers.bottomLeft.panHandlers}
          style={[styles.cornerHandleWrapper, { bottom: 4, left: 4 }]}
          hitSlop={{ top: 2, left: 2, right: 2, bottom: 2 }}
        >
          <CornerHandle
            position="bottomLeft"
            isActive={isDragging || isResizing}
          />
        </View>
        <View
          {...resizeHandlers.bottomRight.panHandlers}
          style={[styles.cornerHandleWrapper, { bottom: 4, right: 4 }]}
          hitSlop={{ top: 2, left: 2, right: 2, bottom: 2 }}
        >
          <CornerHandle
            position="bottomRight"
            isActive={isDragging || isResizing}
          />
        </View>
      </Animated.View>
    );
  }

  // Render bottom sheet mode with proper height animation
  return (
    <View
      style={[styles.fullScreenContainer, zIndex !== undefined && { zIndex }]}
      pointerEvents="box-none"
    >
      <Animated.View
        nativeID="jsmodal-root"
        style={[
          styles.bottomSheetWrapper,
          {
            opacity: modalOpacity,
            transform: [{ translateY: bottomSheetTranslateY }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            customStyles.container,
            {
              height: externalAnimatedHeight || animatedBottomPosition,
            },
          ]}
        >
          <ModalHeader
            header={header}
            onClose={onClose}
            onToggleMode={toggleMode}
            onMinimize={onMinimize ? handleMinimize : undefined}
            isResizing={isResizing}
            mode={mode}
            panHandlers={bottomSheetPanResponder.panHandlers}
          />

          {/* macOS-style window controls - absolute positioned top-right */}
          <View style={styles.windowControlsContainer}>
            <WindowControls
              onClose={onClose}
              onMinimize={onMinimize ? handleMinimize : undefined}
              onToggleMode={toggleMode}
              mode={mode}
            />
          </View>

          {/* Show hint banner if not acknowledged, loaded, and hints not disabled */}
          {hintLoaded &&
            showHint &&
            mode === "bottomSheet" &&
            !hintsDisabled && (
              <ModalHintBanner onAcknowledge={handleHintAcknowledge} />
            )}

          <View style={[styles.content, customStyles.content]}>
            {/* Always wrap in ScrollView with nestedScrollEnabled for FlatList compatibility */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: footerHeight as number,
              }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {children}
            </ScrollView>
            {footer ? (
              <View style={footerStyles.footerContainer}>{footer}</View>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// STYLES - Visual styling for all modal components
// ============================================================================
const styles = StyleSheet.create({
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  bottomSheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: gameUIColors.panel, // Game UI panel
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.border,
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  hiddenContainer: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  floatingModal: {
    position: "absolute",
    backgroundColor: gameUIColors.panel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.border,
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
    zIndex: 1000,
    // Default dimensions, will be overridden by animated values
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
  },
  floatingModalDragging: {
    borderColor: gameUIColors.success,
    borderWidth: 2,
    shadowColor: gameUIColors.success + "99",
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  header: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: gameUIColors.panel, // Game UI panel color
    minHeight: 56,
    borderWidth: 1,
    borderColor: gameUIColors.border, // Theme border
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  floatingHeader: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  windowControlsContainer: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
  },
  floatingModeHeader: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  headerInner: {
    flex: 1,
    justifyContent: "center",
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  dragIndicatorContainerCustom: {
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: "transparent",
  },
  dragIndicator: {
    width: 40,
    height: 3,
    backgroundColor: gameUIColors.info + "99", // Theme indicator
    borderRadius: 2,
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  floatingDragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: gameUIColors.muted,
  },
  dragIndicatorActive: {
    backgroundColor: gameUIColors.success,
    width: 40,
  },
  resizeGripContainer: {
    position: "absolute",
    flexDirection: "row",
    gap: 2,
    marginTop: 12,
  },
  resizeGripLine: {
    width: 12,
    height: 1,
    backgroundColor: gameUIColors.success,
    opacity: 0.6,
  },
  headerContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerControls: {
    position: "absolute",
    top: 8,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: gameUIColors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: gameUIColors.secondary,
    paddingTop: 4,
  },
  headerHintText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  hintText: {
    fontSize: 10,
    color: gameUIColors.muted,
    fontStyle: "italic",
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  toggleButton: {
    backgroundColor: gameUIColors.info + "1A",
    borderWidth: 1,
    borderColor: gameUIColors.info + "33",
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: gameUIColors.error + "1A",
    borderWidth: 1,
    borderColor: gameUIColors.error + "33",
    marginLeft: 8,
  },
  iconLine: {
    position: "absolute",
    top: 7.25,
    left: 2,
    width: 12,
    height: 1.5,
    backgroundColor: gameUIColors.error,
  },
  content: {
    flex: 1,
    backgroundColor: gameUIColors.background,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },
  cornerHandle: {
    position: "absolute",
    zIndex: 1,
  },
  cornerHandleWrapper: {
    position: "absolute",
    width: 30,
    height: 30,
    zIndex: 1000,
  },
  handler: {
    width: 20,
    height: 20,
    backgroundColor: "transparent",
    borderRadius: 10,
    borderWidth: 0,
    borderColor: "transparent",
  },
  handlerActive: {
    backgroundColor: gameUIColors.success + "1A",
    borderColor: gameUIColors.success,
    borderWidth: 2,
    shadowColor: gameUIColors.success + "99",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

// Footer container styles (absolute within modal content area)
const footerStyles = StyleSheet.create({
  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: gameUIColors.background,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});

// ============================================================================
// EXPORT - Memoized modal component for optimal performance
// ============================================================================
export const JsModal = memo(JsModalComponent);
