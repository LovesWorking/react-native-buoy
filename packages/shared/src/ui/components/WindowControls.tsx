import { View, TouchableOpacity, StyleSheet } from "react-native";
import { X, Minus, DockBottom, FloatWindow } from "../../icons";
import type { ModalMode } from "../../JsModal";

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
  /** Current modal mode - determines which icon to show for toggle button */
  mode?: ModalMode;
}

// ============================================================================
// Constants - macOS Style Window Controls
// ============================================================================

// macOS window control colors (matching exact macOS appearance)
const COLORS = {
  close: "#FF5F57", // Red - close button
  minimize: "#FEBC2E", // Yellow - minimize button
  toggleMode: "#28C840", // Green - expand/fullscreen button
};

// macOS-style circular button dimensions
const BUTTON_SIZE = 12; // Small circular buttons
const BUTTON_SPACING = 8; // Spacing between buttons
const ICON_SIZE = 8; // Icon size inside the buttons

// ============================================================================
// Component
// ============================================================================

/**
 * macOS-style window control buttons with Windows ordering.
 * Circular colored buttons inspired by macOS window controls.
 * Order (left to right): Minimize (yellow) → Expand (green) → Close (red)
 */
export function WindowControls({
  onClose,
  onMinimize,
  onToggleMode,
  mode,
}: WindowControlsProps) {
  // Show action-based icon: what will happen when clicked
  // - If floating, show DockBottom (clicking will dock to bottom)
  // - If bottomSheet, show FloatWindow (clicking will make it float)
  const ToggleModeIcon = mode === "floating" ? DockBottom : FloatWindow;
  const toggleModeLabel =
    mode === "floating" ? "Dock to bottom sheet" : "Make floating window";

  return (
    <View style={styles.container}>
      {/* Minimize - leftmost (yellow button) */}
      {onMinimize && (
        <TouchableOpacity
          onPress={onMinimize}
          style={[styles.button, styles.minimizeButton]}
          activeOpacity={0.8}
          accessibilityLabel="Minimize modal"
          accessibilityRole="button"
        >
          <Minus size={ICON_SIZE} color="#7A5A00" strokeWidth={1.5} />
        </TouchableOpacity>
      )}

      {/* Toggle Mode - middle (green button) */}
      {onToggleMode && (
        <TouchableOpacity
          onPress={onToggleMode}
          style={[styles.button, styles.expandButton]}
          activeOpacity={0.8}
          accessibilityLabel={toggleModeLabel}
          accessibilityRole="button"
        >
          <ToggleModeIcon
            size={ICON_SIZE}
            color="#004A1A"
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      )}

      {/* Close - rightmost (red button) */}
      <TouchableOpacity
        onPress={onClose}
        style={[styles.button, styles.closeButton]}
        activeOpacity={0.8}
        accessibilityLabel="Close modal"
        accessibilityRole="button"
      >
        <X size={ICON_SIZE} color="#4A0000" strokeWidth={1.5} />
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
    gap: BUTTON_SPACING,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2, // Perfectly circular
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    backgroundColor: COLORS.close,
  },
  minimizeButton: {
    backgroundColor: COLORS.minimize,
  },
  expandButton: {
    backgroundColor: COLORS.toggleMode,
  },
});
