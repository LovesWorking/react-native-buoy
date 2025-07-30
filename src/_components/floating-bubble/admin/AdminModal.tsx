import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Terminal, X } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";

const { height: screenHeight } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export function AdminModal({ visible, onDismiss, children }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(0.8, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(screenHeight, { duration: 250 }, () => {
        // Animation completed
      });
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={onDismiss}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
          <View style={styles.modal}>
            {/* Header - moved to top, no handle indicator */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Terminal size={16} color="#0EA5E9" />
                </View>
                <Text style={styles.headerText}>Debug Console</Text>
              </View>
              <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Content - ScrollView should fill remaining space */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {children}

              {/* Bottom safe area padding */}
              <View style={{ paddingBottom: insets.bottom + 20 }} />
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.9,
  },
  modal: {
    backgroundColor: "#171717",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "100%",
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
