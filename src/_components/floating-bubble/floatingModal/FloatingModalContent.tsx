import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, { AnimatedStyleProp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DragResizable } from "./DragResizable";
import { FloatingModalHeader } from "./FloatingModalHeader";
import { CornerResizeHandle } from "../admin/components/CornerResizeHandle";
import { PanelDimensions } from "../admin/components/storage/modalStorageOperations";
import { GestureType } from "react-native-gesture-handler";

// Stable constants moved to module scope to prevent re-renders
const MIN_HEIGHT = 150;
const MIN_WIDTH = 300;
const RESIZE_HANDLERS: Array<
  "bottomLeft" | "bottomRight" | "topLeft" | "topRight"
> = ["bottomLeft", "bottomRight", "topLeft", "topRight"];

interface FloatingModalContentProps {
  isFloatingMode: boolean;
  isDragging: boolean;
  isResizing: boolean;
  showToggleButton: boolean;
  customHeaderContent?: ReactNode;
  headerSubtitle?: string;
  children: ReactNode;
  panelDimensions: PanelDimensions;
  containerBounds: { width: number; height: number };
  resizeGesture?: GestureType;
  animatedPanelStyle?: AnimatedStyleProp<ViewStyle>;
  animatedBorderStyle?: AnimatedStyleProp<ViewStyle>;
  onToggleFloatingMode: () => void;
  onClose: () => void;
  onDragStart: () => void;
  onDragEnd: (dimensions: any) => void;
  onResizeStart: () => void;
  onResizeEnd: (dimensions: any) => void;
  onContainerLayout: (bounds: { width: number; height: number }) => void;
}

export const FloatingModalContent = ({
  isFloatingMode,
  isDragging,
  isResizing,
  showToggleButton,
  customHeaderContent,
  headerSubtitle,
  children,
  panelDimensions,
  containerBounds,
  resizeGesture,
  animatedPanelStyle,
  animatedBorderStyle,
  onToggleFloatingMode,
  onClose,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  onContainerLayout,
}: FloatingModalContentProps) => {
  const insets = useSafeAreaInsets();

  // Render function for corner resize handles
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

  // Helper function to render the content with proper layout
  const renderPanelContent = () => (
    <>
      <FloatingModalHeader
        isFloatingMode={isFloatingMode}
        isResizing={isResizing}
        showToggleButton={showToggleButton}
        customHeaderContent={customHeaderContent}
        headerSubtitle={headerSubtitle}
        resizeGesture={resizeGesture}
        onToggleFloatingMode={onToggleFloatingMode}
        onClose={onClose}
      />
      <View style={styles.content}>{children}</View>
    </>
  );

  if (isFloatingMode) {
    // Floating Mode - Draggable and resizable
    return (
      <View
        style={styles.container}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          onContainerLayout({ width, height });
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
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          style={styles.dragResizableContainer}
        >
          <Animated.View
            style={[styles.panel, styles.panelFloating, animatedBorderStyle]}
          >
            {renderPanelContent()}
          </Animated.View>
        </DragResizable>
      </View>
    );
  }

  // Bottom Sheet Mode - Traditional modal
  return (
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
  );
};

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

  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },
});
