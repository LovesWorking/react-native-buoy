import { useState, useRef, useCallback, memo, useEffect } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { copyToClipboard } from "../../clipboard/copyToClipboard";
import { gameUIColors } from "../gameUI/constants/gameUIColors";

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
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            stroke={getColor()}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
      {copyState === "success" && (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 11l3 3 8-8"
            stroke={getColor()}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h9"
            stroke={getColor()}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
      {copyState === "error" && (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"
            stroke={getColor()}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </TouchableOpacity>
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
