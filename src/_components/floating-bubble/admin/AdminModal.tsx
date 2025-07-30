import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Terminal, X } from 'lucide-react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export function AdminModal({ visible, onDismiss, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={onDismiss}
      sentry-label="ignore admin modal"
      animationType="slide"
      navigationBarTranslucent
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <View style={styles.backdrop}>
          <TouchableOpacity
            accessibilityRole="button"
            sentry-label="ignore admin modal backdrop"
            style={styles.backdropTouchable}
            onPress={onDismiss}
            activeOpacity={1}
          />
        </View>

        {/* Modal Content - Full Screen */}
        <View style={styles.modalContainer}>
          <View style={[styles.modal, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Terminal size={16} color="#0EA5E9" />
                </View>
                <Text style={styles.headerText}>Debug Console</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                sentry-label="ignore admin modal close button"
                onPress={onDismiss}
                style={styles.closeButton}
              >
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Content - ScrollView should fill remaining space */}
            <ScrollView
              sentry-label="ignore admin modal scroll view"
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
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  modal: {
    backgroundColor: '#171717',
    flex: 1,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
