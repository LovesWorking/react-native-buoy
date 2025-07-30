import { ReactNode, useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import type { LucideIcon } from "lucide-react-native";
import { X } from "lucide-react-native";

import { ExpandableSection } from "./sections/ExpandableSection";

const { height: screenHeight } = Dimensions.get("window");

interface ExpandableSectionWithModalProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  children: ReactNode | ((closeModal: () => void) => ReactNode); // Modal content or function that returns content
  modalSnapPoints?: string[]; // Kept for compatibility but not used
  enableDynamicSizing?: boolean; // Kept for compatibility but not used
  modalBackgroundColor?: string; // Default to '#0F0F0F'
  handleIndicatorColor?: string; // Default to '#6B7280'
  showModalHeader?: boolean; // Default to true, set to false to hide default header
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

export function ExpandableSectionWithModal({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  children,
  modalBackgroundColor = "#0F0F0F",
  handleIndicatorColor = "#6B7280",
  showModalHeader = true,
  onModalOpen,
  onModalClose,
}: ExpandableSectionWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);

  useEffect(() => {
    if (isModalOpen) {
      backdropOpacity.value = withTiming(0.8, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      gestureTranslateY.value = 0;
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(screenHeight, { duration: 250 });
      gestureTranslateY.value = 0;
    }
  }, [isModalOpen]);

  // Pan gesture to close modal by swiping down
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        gestureTranslateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;

      if (shouldClose) {
        gestureTranslateY.value = withTiming(screenHeight, { duration: 250 });
        runOnJS(closeModal)();
      } else {
        gestureTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
      }
    });

  const openModal = () => {
    gestureTranslateY.value = 0;
    setIsModalOpen(true);
    onModalOpen?.();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    onModalClose?.();
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + gestureTranslateY.value }],
  }));

  return (
    <>
      <ExpandableSection
        icon={icon}
        iconColor={iconColor}
        iconBackgroundColor={iconBackgroundColor}
        title={title}
        subtitle={subtitle}
        onPress={openModal}
      >
        <></>
      </ExpandableSection>

      <Modal
        visible={isModalOpen}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <GestureHandlerRootView style={styles.container}>
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
            <TouchableOpacity
              style={styles.backdropTouchable}
              onPress={closeModal}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Modal Content */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
              <View
                style={[
                  styles.modal,
                  {
                    backgroundColor: modalBackgroundColor,
                    paddingTop: showModalHeader ? insets.top : 0,
                  },
                ]}
              >
                {/* Close Button - moved to top */}
                {showModalHeader && (
                  <View style={styles.headerContainer}>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.closeButton}
                    >
                      <X size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Content */}
                {showModalHeader ? (
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.content}>
                      {typeof children === "function"
                        ? children(closeModal)
                        : children}
                    </View>

                    {/* Bottom safe area padding */}
                    <View style={{ paddingBottom: insets.bottom + 20 }} />
                  </ScrollView>
                ) : (
                  /* Direct content without ScrollView wrapper when no header */
                  <View style={styles.directContent}>
                    {typeof children === "function"
                      ? children(closeModal)
                      : children}
                  </View>
                )}
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Modal>
    </>
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
    maxHeight: screenHeight * 0.9,
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    flex: 1,
  },
  headerContainer: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  directContent: {
    flex: 1,
  },
});
