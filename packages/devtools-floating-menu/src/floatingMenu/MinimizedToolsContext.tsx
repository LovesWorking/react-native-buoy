import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { Dimensions } from "react-native";
import { safeGetItem, safeSetItem, getSafeAreaInsets } from "@react-buoy/shared-ui";

// ============================================================================
// Types
// ============================================================================

/**
 * Modal state to restore when reopening a minimized tool
 */
export interface ModalRestoreState {
  /** Modal display mode */
  mode: "bottomSheet" | "floating";
  /** Panel height for bottom sheet mode */
  panelHeight?: number;
  /** Position for floating mode */
  floatingPosition?: { x: number; y: number };
  /** Dimensions for floating mode */
  floatingDimensions?: { width: number; height: number };
}

/**
 * Represents a minimized tool that can be restored
 */
export interface MinimizedTool {
  /** Unique instance ID for this minimized tool */
  instanceId: string;
  /** Tool identifier (e.g., "storage", "network") */
  id: string;
  /** Display name for the tool */
  title: string;
  /** Icon component or element to display in the minimized stack */
  icon: ReactNode;
  /** Accent color for the tool */
  color?: string;
  /** Timestamp when the tool was minimized */
  minimizedAt: number;
  /** Modal state to restore when reopening */
  modalState?: ModalRestoreState;
}

/**
 * Position for a minimized tool icon in the stack
 */
export interface IconPosition {
  x: number;
  y: number;
}

// ============================================================================
// Constants
// ============================================================================

const ICON_SIZE = 44;
const ICON_GAP = 12;
const BOTTOM_OFFSET = 100; // Distance from safe area bottom
const RIGHT_OFFSET = 16; // Distance from right edge

/**
 * Calculate the position of a minimized tool icon in the stack
 * Icons stack upward from bottom-right corner
 */
export function getIconPosition(index: number): IconPosition {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const safeArea = getSafeAreaInsets();

  // X position: right edge minus icon size and offset
  const x = screenWidth - ICON_SIZE - RIGHT_OFFSET;

  // Y position: bottom up, starting at safe area bottom + offset
  const baseY = screenHeight - safeArea.bottom - BOTTOM_OFFSET - ICON_SIZE;
  const y = baseY - index * (ICON_SIZE + ICON_GAP);

  return { x, y };
}

/**
 * Get the icon size constant
 */
export function getIconSize(): number {
  return ICON_SIZE;
}

/**
 * Context value for minimized tools management
 */
interface MinimizedToolsContextValue {
  /** List of currently minimized tools */
  minimizedTools: MinimizedTool[];
  /** Minimize a tool - removes from open apps and adds to minimized stack */
  minimize: (tool: Omit<MinimizedTool, "minimizedAt">) => void;
  /** Restore a minimized tool - removes from stack and triggers reopen */
  restore: (instanceId: string) => MinimizedTool | null;
  /** Check if a tool is currently minimized */
  isMinimized: (id: string) => boolean;
  /** Get a minimized tool by its instance ID */
  getMinimizedTool: (instanceId: string) => MinimizedTool | undefined;
  /** Clear all minimized tools */
  clearAll: () => void;
  /** Number of minimized tools */
  count: number;
  /** Get the target position for a new minimized icon (for animation) */
  getNextIconPosition: () => IconPosition;
  /** Get position of an existing minimized tool's icon */
  getToolIconPosition: (instanceId: string) => IconPosition | null;
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_KEY = "@react_buoy_minimized_tools";
const PERSISTENCE_DELAY = 500;

/**
 * Serializable version of MinimizedTool for storage
 * (icon is not serializable, so we only store the id to reconstruct)
 */
interface SerializedMinimizedTool {
  instanceId: string;
  id: string;
  title: string;
  color?: string;
  minimizedAt: number;
  modalState?: ModalRestoreState;
}

// ============================================================================
// Context
// ============================================================================

const MinimizedToolsContext = createContext<MinimizedToolsContextValue | null>(
  null
);

// ============================================================================
// Provider
// ============================================================================

interface MinimizedToolsProviderProps {
  children: ReactNode;
  /** Callback to get icon for a tool by its id (used for restoration from storage) */
  getToolIcon?: (id: string) => ReactNode;
}

/**
 * Provider component for minimized tools management.
 * Handles state, persistence, and provides context to children.
 */
export function MinimizedToolsProvider({
  children,
  getToolIcon,
}: MinimizedToolsProviderProps) {
  const [minimizedTools, setMinimizedTools] = useState<MinimizedTool[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const persistenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const getToolIconRef = useRef(getToolIcon);

  // Keep ref updated
  useEffect(() => {
    getToolIconRef.current = getToolIcon;
  }, [getToolIcon]);

  // Restore minimized tools from storage on mount
  useEffect(() => {
    const restoreMinimizedTools = async () => {
      try {
        const saved = await safeGetItem(STORAGE_KEY);
        if (saved) {
          const serialized = JSON.parse(saved) as SerializedMinimizedTool[];
          // Reconstruct tools with icons
          const restored: MinimizedTool[] = serialized.map((tool) => ({
            ...tool,
            icon: getToolIconRef.current?.(tool.id) ?? null,
          }));
          setMinimizedTools(restored);
        }
      } catch (error) {
        // Failed to restore minimized tools - continue with empty state
      }
      setIsRestored(true);
    };

    restoreMinimizedTools();
  }, []);

  // Persist minimized tools to storage with debounce
  useEffect(() => {
    if (!isRestored) return;

    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
    }

    persistenceTimeoutRef.current = setTimeout(() => {
      // Serialize tools (exclude icon which is not serializable)
      const serialized: SerializedMinimizedTool[] = minimizedTools.map(
        ({ icon, ...rest }) => rest
      );
      safeSetItem(STORAGE_KEY, JSON.stringify(serialized));
    }, PERSISTENCE_DELAY);

    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }
    };
  }, [minimizedTools, isRestored]);

  const minimize = useCallback(
    (tool: Omit<MinimizedTool, "minimizedAt">) => {
      setMinimizedTools((current) => {
        // Check if already minimized (by id for singleton behavior)
        const existing = current.find((t) => t.id === tool.id);
        if (existing) {
          // Update existing minimized tool
          return current.map((t) =>
            t.id === tool.id ? { ...tool, minimizedAt: Date.now() } : t
          );
        }
        // Add new minimized tool
        return [...current, { ...tool, minimizedAt: Date.now() }];
      });
    },
    []
  );

  const restore = useCallback((instanceId: string): MinimizedTool | null => {
    let restoredTool: MinimizedTool | null = null;

    setMinimizedTools((current) => {
      const index = current.findIndex((t) => t.instanceId === instanceId);
      if (index === -1) return current;

      restoredTool = current[index];
      return current.filter((t) => t.instanceId !== instanceId);
    });

    return restoredTool;
  }, []);

  const isMinimized = useCallback(
    (id: string): boolean => {
      return minimizedTools.some((t) => t.id === id);
    },
    [minimizedTools]
  );

  const getMinimizedTool = useCallback(
    (instanceId: string): MinimizedTool | undefined => {
      return minimizedTools.find((t) => t.instanceId === instanceId);
    },
    [minimizedTools]
  );

  const clearAll = useCallback(() => {
    setMinimizedTools([]);
  }, []);

  const getNextIconPosition = useCallback((): IconPosition => {
    // Next icon will be at the current count index
    return getIconPosition(minimizedTools.length);
  }, [minimizedTools.length]);

  const getToolIconPosition = useCallback(
    (instanceId: string): IconPosition | null => {
      const index = minimizedTools.findIndex((t) => t.instanceId === instanceId);
      if (index === -1) return null;
      return getIconPosition(index);
    },
    [minimizedTools]
  );

  const value = useMemo<MinimizedToolsContextValue>(
    () => ({
      minimizedTools,
      minimize,
      restore,
      isMinimized,
      getMinimizedTool,
      clearAll,
      count: minimizedTools.length,
      getNextIconPosition,
      getToolIconPosition,
    }),
    [
      minimizedTools,
      minimize,
      restore,
      isMinimized,
      getMinimizedTool,
      clearAll,
      getNextIconPosition,
      getToolIconPosition,
    ]
  );

  return (
    <MinimizedToolsContext.Provider value={value}>
      {children}
    </MinimizedToolsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access minimized tools context.
 * Must be used within a MinimizedToolsProvider.
 */
export function useMinimizedTools(): MinimizedToolsContextValue {
  const context = useContext(MinimizedToolsContext);

  if (!context) {
    // Return a no-op implementation when outside provider
    return {
      minimizedTools: [],
      minimize: () => {},
      restore: () => null,
      isMinimized: () => false,
      getMinimizedTool: () => undefined,
      clearAll: () => {},
      count: 0,
      getNextIconPosition: () => ({ x: 0, y: 0 }),
      getToolIconPosition: () => null,
    };
  }

  return context;
}
