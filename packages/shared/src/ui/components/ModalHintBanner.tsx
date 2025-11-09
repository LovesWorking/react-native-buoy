/**
 * ModalHintBanner - A hint banner that shows users they can double-tap to toggle modal mode
 *
 * Displays a dismissible hint to educate users about the double-tap gesture.
 * Automatically manages storage to remember when the user acknowledges the hint.
 */

import { memo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { gameUIColors } from "../gameUI";

interface ModalHintBannerProps {
  onAcknowledge: () => void;
}

/**
 * A visually striking hint banner that teaches users about double-tap functionality
 */
export const ModalHintBanner = memo(function ModalHintBanner({
  onAcknowledge,
}: ModalHintBannerProps) {
  const handleAcknowledge = useCallback(() => {
    onAcknowledge();
  }, [onAcknowledge]);

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Icon indicator */}
        <View style={styles.iconContainer}>
          <View style={styles.tapIndicator}>
            <View style={[styles.tapCircle, styles.tapCircle1]} />
            <View style={[styles.tapCircle, styles.tapCircle2]} />
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>💡 Pro Tip</Text>
          <Text style={styles.messageText}>
            Double-tap the header to transform this into a floating modal
          </Text>
        </View>

        {/* Acknowledge button */}
        <TouchableOpacity
          style={styles.acknowledgeButton}
          onPress={handleAcknowledge}
          activeOpacity={0.7}
        >
          <Text style={styles.acknowledgeButtonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${gameUIColors.info}15`,
    borderLeftWidth: 3,
    borderLeftColor: gameUIColors.info,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    overflow: "hidden",
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  tapIndicator: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  tapCircle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: gameUIColors.info,
  },
  tapCircle1: {
    opacity: 0.6,
    transform: [{ scale: 0.8 }],
  },
  tapCircle2: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  messageContainer: {
    flex: 1,
    gap: 2,
  },
  messageTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: gameUIColors.info,
    letterSpacing: 0.3,
  },
  messageText: {
    fontSize: 12,
    color: gameUIColors.primaryLight,
    lineHeight: 16,
  },
  acknowledgeButton: {
    backgroundColor: `${gameUIColors.info}30`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${gameUIColors.info}50`,
  },
  acknowledgeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: gameUIColors.info,
  },
});
