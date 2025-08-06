import { ReactNode } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { GestureDetector, GestureType } from "react-native-gesture-handler";
import { Maximize2, Minimize2, X } from "lucide-react-native";

const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

interface FloatingModalHeaderProps {
  isFloatingMode: boolean;
  isResizing: boolean;
  showToggleButton: boolean;
  customHeaderContent?: ReactNode;
  headerSubtitle?: string;
  resizeGesture?: GestureType;
  onToggleFloatingMode: () => void;
  onClose: () => void;
  hideCloseButton?: boolean;
}

// Single-purpose component: Handles drag indicator visualization and resize state feedback
const DragIndicator = ({ isResizing }: { isResizing: boolean }) => (
  <View style={styles.dragIndicator}>
    <View style={[styles.resizeGrip, isResizing && styles.resizeGripActive]} />
  </View>
);

// Single-purpose component: Displays custom content when provided
const CustomHeaderSection = ({ children }: { children: ReactNode }) => (
  <View style={styles.customHeaderContent}>{children}</View>
);

// Single-purpose component: Manages toggle and close control buttons
const HeaderControls = ({
  showToggleButton,
  isFloatingMode,
  onToggleFloatingMode,
  onClose,
  hideCloseButton,
}: {
  showToggleButton: boolean;
  isFloatingMode: boolean;
  onToggleFloatingMode: () => void;
  onClose: () => void;
  hideCloseButton?: boolean;
}) => (
  <View style={styles.headerControls}>
    {showToggleButton && (
      <Pressable
        accessibilityLabel="Toggle floating mode"
        accessibilityHint="Toggle floating mode"
        sentry-label="ignore user interaction"
        onPress={onToggleFloatingMode}
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
    {!hideCloseButton && (
      <Pressable
        accessibilityLabel="Close"
        accessibilityHint="Close floating modal"
        sentry-label="ignore user interaction"
        onPress={onClose}
        style={[styles.controlButton, styles.controlButtonDanger]}
        hitSlop={HIT_SLOP}
      >
        <X color="#FFFFFF" size={16} />
      </Pressable>
    )}
  </View>
);

// Single-purpose component: Renders subtitle text when provided
const SubtitleSection = ({ subtitle }: { subtitle: string }) => (
  <View style={styles.subtitleContainer}>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

// Utilizes Render Props pattern: Wrapper component that conditionally applies gesture detection
const GestureWrapper = ({
  shouldApplyGesture,
  gesture,
  children,
}: {
  shouldApplyGesture: boolean;
  gesture?: GestureType;
  children: ReactNode;
}) => {
  if (shouldApplyGesture && gesture) {
    return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
  }
  return <>{children}</>;
};

// Main component: Serves as composition coordinator, orchestrating smaller components
export const FloatingModalHeader = ({
  isFloatingMode,
  isResizing,
  showToggleButton,
  customHeaderContent,
  headerSubtitle,
  resizeGesture,
  onToggleFloatingMode,
  onClose,
  hideCloseButton,
}: FloatingModalHeaderProps) => {
  const headerContent = (
    <View style={styles.header}>
      <DragIndicator isResizing={isResizing} />
      <View style={styles.headerContent}>
        <View style={styles.mainHeaderRow}>
          {customHeaderContent && (
            <CustomHeaderSection>{customHeaderContent}</CustomHeaderSection>
          )}
          <HeaderControls
            showToggleButton={showToggleButton}
            isFloatingMode={isFloatingMode}
            onToggleFloatingMode={onToggleFloatingMode}
            onClose={onClose}
            hideCloseButton={hideCloseButton}
          />
        </View>
        {headerSubtitle && <SubtitleSection subtitle={headerSubtitle} />}
      </View>
    </View>
  );

  return (
    <GestureWrapper
      shouldApplyGesture={!isFloatingMode}
      gesture={resizeGesture}
    >
      {headerContent}
    </GestureWrapper>
  );
};

const styles = StyleSheet.create({
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

  // Header content matching DevToolsHeader patterns but single row for floating
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)", // Exact match with DevToolsHeader
    backgroundColor: "#171717",
  },

  // Main header row layout
  mainHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32,
  },

  // Custom header content container
  customHeaderContent: {
    flex: 1,
    minHeight: 32, // Ensure minimum height for visibility
    justifyContent: "center", // Center content vertically
  },

  // Header controls container
  headerControls: {
    flexDirection: "row",
    gap: 6,
    zIndex: 1001, // Higher than corner handles (1000) to ensure button clicks work
    paddingRight: 4, // Add some padding to move buttons away from edge
    marginLeft: 12, // Add space between custom content and controls
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
});
