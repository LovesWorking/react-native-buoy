import { useState, useEffect } from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PanelDimensions,
  loadPanelState,
  savePanelDimensions,
  savePanelHeight,
  saveFloatingMode,
} from "../components/storage/modalStorageOperations";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MIN_HEIGHT = 150;
const MIN_WIDTH = 300;
const DEFAULT_HEIGHT = 400;
const DEFAULT_WIDTH = SCREEN_WIDTH - 40;

export interface ModalStateConfig {
  storagePrefix: string;
}

export interface ModalState {
  isFloatingMode: boolean;
  isDragging: boolean;
  isResizing: boolean;
  isStateLoaded: boolean;
  panelDimensions: PanelDimensions;
  panelHeight: number;
  containerBounds: { width: number; height: number };
  toggleFloatingMode: () => void;
  setIsDragging: (dragging: boolean) => void;
  setIsResizing: (resizing: boolean) => void;
  updatePanelDimensions: (dimensions: PanelDimensions) => void;
  updatePanelHeight: (height: number) => void;
  setContainerBounds: (bounds: { width: number; height: number }) => void;
}

export const useModalState = ({
  storagePrefix,
}: ModalStateConfig): ModalState => {
  const insets = useSafeAreaInsets();

  const [isFloatingMode, setIsFloatingMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);

  // State for drag/resize container bounds
  const [containerBounds, setContainerBounds] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - insets.top - insets.bottom,
  });

  // State for panel dimensions
  const [panelDimensions, setPanelDimensions] = useState<PanelDimensions>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    top: 100,
    left: 20,
  });

  // Load persisted state on component mount
  useEffect(() => {
    const loadState = async () => {
      const { dimensions, height, isFloating } =
        await loadPanelState(storagePrefix);

      if (dimensions) {
        // Validate stored dimensions are within current screen bounds
        const validatedDimensions = {
          width: Math.max(MIN_WIDTH, Math.min(dimensions.width, SCREEN_WIDTH)),
          height: Math.max(
            MIN_HEIGHT,
            Math.min(dimensions.height, SCREEN_HEIGHT)
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

  // Save panel height to storage when it changes (debounced to avoid excessive writes)
  useEffect(() => {
    if (isStateLoaded) {
      const timeoutId = setTimeout(() => {
        savePanelHeight(storagePrefix, panelHeight);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [panelHeight, isStateLoaded, storagePrefix]);

  const toggleFloatingMode = () => {
    const newMode = !isFloatingMode;
    setIsFloatingMode(newMode);
    saveFloatingMode(storagePrefix, newMode);
  };

  const updatePanelDimensions = (dimensions: PanelDimensions) => {
    setPanelDimensions(dimensions);
    savePanelDimensions(storagePrefix, dimensions);
  };

  const updatePanelHeight = (height: number) => {
    setPanelHeight(height);
  };

  return {
    isFloatingMode,
    isDragging,
    isResizing,
    isStateLoaded,
    panelDimensions,
    panelHeight,
    containerBounds,
    toggleFloatingMode,
    setIsDragging,
    setIsResizing,
    updatePanelDimensions,
    updatePanelHeight,
    setContainerBounds,
  };
};
