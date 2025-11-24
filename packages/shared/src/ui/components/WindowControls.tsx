import { View, TouchableOpacity, StyleSheet } from "react-native";
import { X, Minus, Maximize2 } from "../../icons";

// ============================================================================
// Types
// ============================================================================

interface WindowControlsProps {
  /** Handler for close button */
  onClose: () => void;
  /** Handler for minimize button (optional - hides button if not provided) */
  onMinimize?: () => void;
  /** Handler for resize/toggle mode button (optional - hides button if not provided) */
  onToggleMode?: () => void;
}

// ============================================================================
// Constants - macOS Traffic Light Colors
// ============================================================================

const COLORS = {
  close: "#FF5F56",
  minimize: "#FFBD2E",
  resize: "#27C93F",
  icon: "#4A4A4A",
};

// macOS uses 12px diameter buttons with 8px gap
const BUTTON_SIZE = 12;
const ICON_SIZE = 8;
const GAP = 8;

// ============================================================================
// Component
// ============================================================================

/**
 * macOS-style window control buttons (traffic lights).
 * Provides close, minimize, and resize/toggle mode buttons.
 * Positioned absolute top-right in the modal header.
 */
export function WindowControls({
  onClose,
  onMinimize,
  onToggleMode,
}: WindowControlsProps) {
  return (
    <View style={styles.container}>
      {/* Resize/Toggle Mode - Green (leftmost) */}
      {onToggleMode && (
        <TouchableOpacity
          onPress={onToggleMode}
          style={[styles.button, styles.resizeButton]}
          activeOpacity={0.7}
          accessibilityLabel="Toggle modal mode"
          accessibilityRole="button"
        >
          <Maximize2 size={ICON_SIZE} color={COLORS.icon} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Minimize - Yellow (middle) */}
      {onMinimize && (
        <TouchableOpacity
          onPress={onMinimize}
          style={[styles.button, styles.minimizeButton]}
          activeOpacity={0.7}
          accessibilityLabel="Minimize modal"
          accessibilityRole="button"
        >
          <Minus size={ICON_SIZE} color={COLORS.icon} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Close - Red (rightmost, always visible) */}
      <TouchableOpacity
        onPress={onClose}
        style={[styles.button, styles.closeButton]}
        activeOpacity={0.7}
        accessibilityLabel="Close modal"
        accessibilityRole="button"
      >
        <X size={ICON_SIZE} color={COLORS.icon} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    backgroundColor: COLORS.close,
  },
  minimizeButton: {
    backgroundColor: COLORS.minimize,
  },
  resizeButton: {
    backgroundColor: COLORS.resize,
  },
});
