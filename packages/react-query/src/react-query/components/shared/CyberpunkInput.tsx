import { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Text,
  Animated,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/gameUIColors";

interface CyberpunkInputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  showNumberControls?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

export function CyberpunkInput({
  label,
  containerStyle,
  showNumberControls = false,
  onIncrement,
  onDecrement,
  showDeleteButton = false,
  onDelete,
  ...props
}: CyberpunkInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Animated values for glitch effect
  const glitchOpacity = useRef(new Animated.Value(0)).current;
  const glitchX = useRef(new Animated.Value(0)).current;
  const glitchY = useRef(new Animated.Value(0)).current;
  const glitchScale = useRef(new Animated.Value(1)).current;
  const borderGlow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isFocused) {
      // Border glow animation
      Animated.timing(borderGlow, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Glitch opacity animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glitchOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.8,
            duration: 30,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.6,
            duration: 40,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0,
            duration: 30,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.4,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Glitch X displacement
      Animated.loop(
        Animated.sequence([
          Animated.timing(glitchX, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 3,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: -3,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 2,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 0,
            duration: 20,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Glitch Y displacement
      Animated.loop(
        Animated.sequence([
          Animated.timing(glitchY, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(glitchY, {
            toValue: -2,
            duration: 30,
            useNativeDriver: true,
          }),
          Animated.timing(glitchY, {
            toValue: 1,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchY, {
            toValue: 0,
            duration: 30,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Glitch scale effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glitchScale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 1.01,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 0.99,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 1,
            duration: 20,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      // Reset animations when not focused
      Animated.timing(borderGlow, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.timing(glitchOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();

      Animated.timing(glitchX, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();

      Animated.timing(glitchY, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();

      Animated.timing(glitchScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, borderGlow, glitchOpacity, glitchX, glitchY, glitchScale]);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const containerAnimatedStyle = {
    opacity: borderGlow,
    borderColor: isFocused ? gameUIColors.info : gameUIColors.muted + "4D",
  };

  const glitchAnimatedStyle = {
    opacity: glitchOpacity,
    transform: [
      { translateX: glitchX },
      { translateY: glitchY },
      { scale: glitchScale },
    ],
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.rowContainer}>
        {/* Label */}
        {label && (
          <Text style={[styles.label, isFocused && styles.labelFocused]}>
            {label.toUpperCase()}
          </Text>
        )}

        {/* Input container */}
        <Animated.View style={[styles.inputContainer, containerAnimatedStyle]}>
          {/* Glitch overlay when focused */}
          <Animated.View
            style={[styles.glitchOverlay, glitchAnimatedStyle]}
            pointerEvents="none"
          />

          <TextInput
            {...props}
            style={[
              styles.input,
              props.style,
              showNumberControls && styles.inputWithControls,
              showDeleteButton && styles.inputWithDelete,
            ]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={gameUIColors.muted + "99"}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />

          {/* Number control buttons */}
          {showNumberControls && (
            <View style={styles.numberControls}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  isFocused && styles.controlButtonFocused,
                ]}
                onPress={onIncrement}
                activeOpacity={0.7}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4.5 15.75l7.5-7.5 7.5 7.5"
                    stroke={isFocused ? gameUIColors.info : gameUIColors.muted}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  isFocused && styles.controlButtonFocused,
                ]}
                onPress={onDecrement}
                activeOpacity={0.7}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    stroke={isFocused ? gameUIColors.info : gameUIColors.muted}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          )}

          {/* Delete button */}
          {showDeleteButton && (
            <TouchableOpacity
              style={[
                styles.deleteButton,
                isFocused && styles.deleteButtonFocused,
              ]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 3h6M3 6h18m-2 0l-.701 10.52c-.105 1.578-.158 2.367-.499 2.965a3 3 0 01-1.298 1.215c-.62.3-1.41.3-2.993.3h-3.018c-1.582 0-2.373 0-2.993-.3A3 3 0 016.2 19.485c-.34-.598-.394-1.387-.499-2.966L5 6m5 4.5v5m4-5v5"
                  stroke={
                    isFocused ? gameUIColors.error : gameUIColors.error + "CC"
                  }
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}

          {/* Corner accents */}
          <View
            style={[
              styles.cornerAccent,
              styles.cornerTL,
              isFocused && styles.cornerAccentFocused,
            ]}
          />
          <View
            style={[
              styles.cornerAccent,
              styles.cornerTR,
              isFocused && styles.cornerAccentFocused,
            ]}
          />
          <View
            style={[
              styles.cornerAccent,
              styles.cornerBL,
              isFocused && styles.cornerAccentFocused,
            ]}
          />
          <View
            style={[
              styles.cornerAccent,
              styles.cornerBR,
              isFocused && styles.cornerAccentFocused,
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 3,
  },

  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  label: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
    color: gameUIColors.muted,
    letterSpacing: 0.5,
    minWidth: 60,
  },

  labelFocused: {
    color: gameUIColors.info,
  },

  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    position: "relative",
    minHeight: 34,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },

  glitchOverlay: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.info,
    zIndex: 10,
  },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: gameUIColors.primaryLight,
    fontSize: 12,
    fontFamily: "monospace",
    backgroundColor: "transparent",
    zIndex: 1,
  },

  inputWithControls: {
    paddingRight: 4,
  },

  inputWithDelete: {
    paddingRight: 4,
  },

  numberControls: {
    flexDirection: "row",
    gap: 2,
    paddingRight: 4,
    zIndex: 2,
  },

  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.muted + "33",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  controlButtonFocused: {
    borderColor: gameUIColors.info + "CC",
    shadowColor: "#06B6D4",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.error + "4D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    marginRight: 4,
    zIndex: 2,
  },

  deleteButtonFocused: {
    borderColor: gameUIColors.error + "CC",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  cornerAccent: {
    position: "absolute",
    width: 6,
    height: 1.2,
    backgroundColor: gameUIColors.muted + "CC",
    zIndex: 0,
  },

  cornerAccentFocused: {
    backgroundColor: gameUIColors.info,
  },

  cornerTL: {
    top: -1,
    left: 5,
  },

  cornerTR: {
    top: -1,
    right: 5,
  },

  cornerBL: {
    bottom: -1,
    left: 5,
  },

  cornerBR: {
    bottom: -1,
    right: 5,
  },
});
