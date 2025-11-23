import { useState, useRef, useCallback, memo, useEffect } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { copyToClipboard } from "../../clipboard/copyToClipboard";
import { gameUIColors } from "../gameUI/constants/gameUIColors";
import { Copy, CheckCircle2, AlertTriangle } from "../../icons/lucide-icons";
import { ClipboardHintBanner } from "./ClipboardHintBanner";
import { devToolsStorageKeys } from "../../storage/devToolsStorageKeys";
import { safeGetItem, safeSetItem } from "../../utils/safeAsyncStorage";

type CopyState = "idle" | "success" | "error";

interface CopyButtonProps extends Omit<TouchableOpacityProps, "onPress"> {
  /** The value to copy - can be any type (string, object, array, etc.) */
  value: unknown;
  /** Whether the button is in a focused/highlighted state */
  isFocused?: boolean;
  /** Size of the icon (default: 16) */
  size?: number;
  /** Custom styles for the button container */
  buttonStyle?: ViewStyle;
  /** Callback after successful copy */
  onCopySuccess?: () => void;
  /** Callback after failed copy */
  onCopyError?: () => void;
  /** Duration to show success/error state in ms (default: 1500) */
  feedbackDuration?: number;
  /** Custom colors for each state */
  colors?: {
    idle?: string;
    idleFocused?: string;
    success?: string;
    error?: string;
  };
}

/**
 * Reusable copy button component with visual feedback
 * Shows different icons for idle, success, and error states
 * Based on the React Query dev tools copy button implementation
 */
// Global state to track if hint has been shown (shared across all CopyButton instances)
let globalHintAcknowledged: boolean | null = null;
let globalHintLoadPromise: Promise<boolean> | null = null;

async function loadHintAcknowledged(): Promise<boolean> {
  if (globalHintAcknowledged !== null) {
    return globalHintAcknowledged;
  }
  if (!globalHintLoadPromise) {
    globalHintLoadPromise = (async () => {
      try {
        const hintKey = devToolsStorageKeys.clipboard.hintAcknowledged();
        const acknowledged = await safeGetItem(hintKey);
        globalHintAcknowledged = acknowledged === "true";
        return globalHintAcknowledged;
      } catch {
        globalHintAcknowledged = false;
        return false;
      }
    })();
  }
  return globalHintLoadPromise;
}

async function setHintAcknowledged(): Promise<void> {
  try {
    const hintKey = devToolsStorageKeys.clipboard.hintAcknowledged();
    await safeSetItem(hintKey, "true");
    globalHintAcknowledged = true;
  } catch {
    // Failed to save, just update local state
    globalHintAcknowledged = true;
  }
}

export const CopyButton = memo(function CopyButton({
  value,
  isFocused = false,
  size = 16,
  buttonStyle,
  onCopySuccess,
  onCopyError,
  feedbackDuration = 1500,
  colors = {},
  ...touchableProps
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [showHint, setShowHint] = useState(false);
  const valueRef = useRef(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  valueRef.current = value;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle hint acknowledgment
  const handleHintAcknowledge = useCallback(async () => {
    setShowHint(false);
    await setHintAcknowledged();
  }, []);

  const handleCopy = useCallback(async () => {
    // Clear existing timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      const copied = await copyToClipboard(valueRef.current);
      if (copied) {
        setCopyState("success");
        onCopySuccess?.();

        // Check if we should show the hint (first successful copy)
        const alreadyAcknowledged = await loadHintAcknowledged();
        if (!alreadyAcknowledged) {
          setShowHint(true);
        }

        timeoutRef.current = setTimeout(() => {
          setCopyState("idle");
          timeoutRef.current = null;
        }, feedbackDuration);
      } else {
        setCopyState("error");
        onCopyError?.();
        timeoutRef.current = setTimeout(() => {
          setCopyState("idle");
          timeoutRef.current = null;
        }, feedbackDuration);
      }
    } catch {
      setCopyState("error");
      onCopyError?.();
      timeoutRef.current = setTimeout(() => {
        setCopyState("idle");
        timeoutRef.current = null;
      }, feedbackDuration);
    }
  }, [feedbackDuration, onCopySuccess, onCopyError]);

  const getColor = useCallback(() => {
    switch (copyState) {
      case "success":
        return colors.success || gameUIColors.success;
      case "error":
        return colors.error || gameUIColors.error;
      default:
        return isFocused
          ? colors.idleFocused || gameUIColors.info
          : colors.idle || gameUIColors.secondary;
    }
  }, [copyState, isFocused, colors]);

  return (
    <>
      <TouchableOpacity
        {...touchableProps}
        style={[styles.button, buttonStyle]}
        onPress={copyState === "idle" ? handleCopy : undefined}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={
          copyState === "idle"
            ? "Copy to clipboard"
            : copyState === "success"
            ? "Copied to clipboard"
            : "Failed to copy"
        }
        accessibilityRole="button"
      >
        {copyState === "idle" && (
          <Copy size={size} color={getColor()} strokeWidth={2} />
        )}
        {copyState === "success" && (
          <CheckCircle2 size={size} color={getColor()} strokeWidth={2} />
        )}
        {copyState === "error" && (
          <AlertTriangle size={size} color={getColor()} strokeWidth={2} />
        )}
      </TouchableOpacity>
      <ClipboardHintBanner
        visible={showHint}
        onAcknowledge={handleHintAcknowledge}
      />
    </>
  );
});

const styles = StyleSheet.create({
  button: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

/**
 * Preset copy button for inline use (smaller size)
 */
export const InlineCopyButton = memo(function InlineCopyButton(
  props: Omit<CopyButtonProps, "size">
) {
  return <CopyButton size={12} {...props} />;
});

/**
 * Preset copy button for header/toolbar use (medium size)
 */
export const ToolbarCopyButton = memo(function ToolbarCopyButton(
  props: Omit<CopyButtonProps, "size">
) {
  return <CopyButton size={14} {...props} />;
});

/**
 * Preset copy button for main actions (larger size)
 */
export const ActionCopyButton = memo(function ActionCopyButton(
  props: Omit<CopyButtonProps, "size">
) {
  return <CopyButton size={18} {...props} />;
});
