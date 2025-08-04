import { ReactNode } from "react";
import { useAnimatedStyle } from "react-native-reanimated";
import { useModalState, useModalResize } from "../admin/hooks";
import { FloatingModalContent } from "./FloatingModalContent";
import { PanelDimensions } from "../admin/components/storage/modalStorageOperations";

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
  // Extract all state management to custom hook
  const modalState = useModalState({ storagePrefix });

  // Extract resize functionality to custom hook
  const { resizeGesture, animatedPanelStyle } = useModalResize({
    isFloatingMode: modalState.isFloatingMode,
    panelHeight: modalState.panelHeight,
    isResizing: modalState.isResizing,
    setIsResizing: modalState.setIsResizing,
    updatePanelHeight: modalState.updatePanelHeight,
  });

  // Animated border style for drag/resize feedback (only for floating mode)
  const animatedBorderStyle = useAnimatedStyle(() => {
    const normalBorder = "rgba(255, 255, 255, 0.1)";
    const activeBorder = "rgba(34, 197, 94, 1)";
    // Only show green border when in floating mode and actively dragging/resizing
    const isActive =
      modalState.isFloatingMode &&
      (modalState.isDragging || modalState.isResizing);

    return {
      borderColor: isActive ? activeBorder : normalBorder,
      borderWidth: isActive ? 2 : 1,
      shadowColor: isActive ? "rgba(34, 197, 94, 0.6)" : "#000",
      shadowOpacity: isActive ? 0.8 : 0.3,
      shadowRadius: isActive ? 12 : 8,
      elevation: isActive ? 20 : 16,
    };
  });

  // Event handlers for drag/resize operations
  const handleDragEnd = (dimensions: PanelDimensions) => {
    const newDimensions: PanelDimensions = {
      ...modalState.panelDimensions,
      top: dimensions.top,
      left: dimensions.left,
    };
    modalState.updatePanelDimensions(newDimensions);
    modalState.setIsDragging(false);
  };

  const handleResizeEnd = (dimensions: PanelDimensions) => {
    modalState.updatePanelDimensions(dimensions);
    modalState.setIsResizing(false);
  };

  const handleDragStart = () => {
    modalState.setIsDragging(true);
  };

  const handleResizeStart = () => {
    modalState.setIsResizing(true);
  };

  if (!visible || !modalState.isStateLoaded) return null;

  return (
    <FloatingModalContent
      isFloatingMode={modalState.isFloatingMode}
      isDragging={modalState.isDragging}
      isResizing={modalState.isResizing}
      showToggleButton={showToggleButton}
      customHeaderContent={customHeaderContent}
      headerSubtitle={headerSubtitle}
      panelDimensions={modalState.panelDimensions}
      containerBounds={modalState.containerBounds}
      resizeGesture={resizeGesture}
      animatedPanelStyle={animatedPanelStyle}
      animatedBorderStyle={animatedBorderStyle}
      onToggleFloatingMode={modalState.toggleFloatingMode}
      onClose={onClose}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onResizeStart={handleResizeStart}
      onResizeEnd={handleResizeEnd}
      onContainerLayout={modalState.setContainerBounds}
    >
      {children}
    </FloatingModalContent>
  );
}
