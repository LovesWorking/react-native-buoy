import { ReactNode, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import { X } from "lucide-react-native";

import { ExpandableSection } from "./ExpandableSection";

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
  handleIndicatorColor?: string; // Default to '#6B7280' (kept for compatibility)
  showModalHeader?: boolean; // Default to true, set to false to hide default header
  fullScreen?: boolean; // Default to false, set to true for full-screen modal
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
  handleIndicatorColor = "#6B7280", // Kept for compatibility
  showModalHeader = true,
  fullScreen = false,
  onModalOpen,
  onModalClose,
}: ExpandableSectionWithModalProps) {
  // Suppress unused variable warning - kept for compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unusedHandleIndicatorColor = handleIndicatorColor;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const openModal = () => {
    setIsModalOpen(true);
    onModalOpen?.();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    onModalClose?.();
  };

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
        accessibilityLabel="Expandable section modal"
        accessibilityHint="View expandable section modal"
        sentry-label="ignore expandable section modal"
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.container}>
          {/* Backdrop */}
          <View style={styles.backdrop}>
            <TouchableOpacity
              accessibilityLabel="Modal backdrop close"
              accessibilityHint="View modal backdrop close"
              sentry-label="ignore modal backdrop close"
              accessibilityRole="button"
              style={styles.backdropTouchable}
              onPress={closeModal}
              activeOpacity={1}
            />
          </View>

          {/* Modal Content */}
          <View
            style={
              fullScreen
                ? styles.fullScreenModalContainer
                : styles.modalContainer
            }
          >
            <View
              style={[
                fullScreen ? styles.fullScreenModal : styles.modal,
                {
                  backgroundColor: modalBackgroundColor,
                  paddingTop: fullScreen
                    ? insets.top
                    : showModalHeader
                      ? insets.top
                      : 0,
                },
              ]}
            >
              {/* Close Button - moved to top */}
              {showModalHeader && (
                <View style={styles.headerContainer}>
                  <TouchableOpacity
                    accessibilityLabel="Modal close button"
                    accessibilityHint="View modal close button"
                    sentry-label="ignore modal close button"
                    accessibilityRole="button"
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
                  accessibilityLabel="Modal content scroll"
                  accessibilityHint="View modal content scroll"
                  sentry-label="ignore modal content scroll"
                  style={styles.scrollView}
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  scrollEventThrottle={16}
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
                /* Direct content without ScrollView wrapper when no header - allows internal gesture handling */
                <View style={styles.directContent} pointerEvents="box-none">
                  {typeof children === "function"
                    ? children(closeModal)
                    : children}
                </View>
              )}
            </View>
          </View>
        </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
  fullScreenModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight,
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    flex: 1,
  },
  fullScreenModal: {
    flex: 1,
    minHeight: screenHeight,
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
