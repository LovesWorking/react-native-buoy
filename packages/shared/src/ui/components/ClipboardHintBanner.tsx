/**
 * ClipboardHintBanner - A hint banner that shows users how to fix iOS Simulator clipboard sync
 *
 * Displays a dismissible hint to educate users about the iOS Simulator's
 * "Automatically Sync Pasteboard" setting that needs to be toggled if copy doesn't work.
 * Automatically manages storage to remember when the user acknowledges the hint.
 */

import { memo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { gameUIColors } from "../gameUI";

interface ClipboardHintBannerProps {
  visible: boolean;
  onAcknowledge: () => void;
}

/**
 * A modal hint that teaches users about iOS Simulator clipboard sync
 */
export const ClipboardHintBanner = memo(function ClipboardHintBanner({
  visible,
  onAcknowledge,
}: ClipboardHintBannerProps) {
  const handleAcknowledge = useCallback(() => {
    onAcknowledge();
  }, [onAcknowledge]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleAcknowledge}
    >
      <Pressable style={styles.overlay} onPress={handleAcknowledge}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.inner}>
            {/* Icon indicator */}
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📋</Text>
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>Clipboard Tip</Text>
              <Text style={styles.messageText}>
                Content copied! If paste doesn't work on your Mac, go to the iOS
                Simulator menu:{"\n\n"}
                <Text style={styles.menuPath}>
                  Edit → Automatically Sync Pasteboard
                </Text>
                {"\n\n"}Toggle it off and on again to fix the sync.
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
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: gameUIColors.panel,
    borderLeftWidth: 3,
    borderLeftColor: gameUIColors.info,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 340,
  },
  inner: {
    padding: 20,
    gap: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${gameUIColors.info}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 24,
  },
  messageContainer: {
    gap: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: gameUIColors.info,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  messageText: {
    fontSize: 13,
    color: gameUIColors.primaryLight,
    lineHeight: 20,
    textAlign: "center",
  },
  menuPath: {
    fontFamily: "monospace",
    fontSize: 12,
    color: gameUIColors.primary,
    fontWeight: "600",
  },
  acknowledgeButton: {
    backgroundColor: gameUIColors.info,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  acknowledgeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
