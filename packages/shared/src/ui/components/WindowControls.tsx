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
// Constants - Windows Vista Style with macOS Design System Colors
// ============================================================================

// Using colors from macOSDesignSystemColors
const COLORS = {
  // Neutral actions use muted/secondary colors
  minimize: "#A1A1A6", // text.secondary - subtle, non-destructive
  toggleMode: "#A1A1A6", // text.secondary - subtle, non-destructive
  // Destructive action uses red
  close: "#FF453A", // semantic.error - clear destructive intent
};

// Touch-friendly button sizes
// Apple HIG recommends 44pt minimum, Android 48dp
// Using 38x38 as a balance for toolbar controls
const BUTTON_SIZE = 38;
const ICON_SIZE = 16;

// ============================================================================
// Component
// ============================================================================

/**
 * Windows Vista-style window control buttons.
 * Rectangular buttons that fill the header height, positioned flush right.
 * Order: Minimize → Toggle Mode → Close
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
      {/* Minimize - leftmost */}
      {onMinimize && (
        <TouchableOpacity
          onPress={onMinimize}
          style={styles.button}
          activeOpacity={0.7}
          accessibilityLabel="Minimize modal"
          accessibilityRole="button"
        >
          <Minus size={ICON_SIZE} color={COLORS.minimize} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Toggle Mode - middle */}
      {onToggleMode && (
        <TouchableOpacity
          onPress={onToggleMode}
          style={styles.button}
          activeOpacity={0.7}
          accessibilityLabel={toggleModeLabel}
          accessibilityRole="button"
        >
          <ToggleModeIcon
            size={ICON_SIZE}
            color={COLORS.toggleMode}
            strokeWidth={2}
          />
        </TouchableOpacity>
      )}

      {/* Close - rightmost, always visible */}
      <TouchableOpacity
        onPress={onClose}
        style={styles.button}
        activeOpacity={0.7}
        accessibilityLabel="Close modal"
        accessibilityRole="button"
      >
        <X size={ICON_SIZE} color={COLORS.close} strokeWidth={2} />
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
    height: BUTTON_SIZE,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
