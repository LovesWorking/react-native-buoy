import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, X } from 'lucide-react-native';

import { ExpandableSectionWithModal } from './ExpandableSectionWithModal';

// Example modal content component
interface MyFeatureModalContentProps {
  onClose: () => void;
}

function MyFeatureModalContent({ onClose }: MyFeatureModalContentProps) {
  const [counter, setCounter] = useState(0);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Settings size={18} color="#10B981" />
          </View>
          <Text style={styles.title}>My Custom Feature</Text>
        </View>
        <TouchableOpacity
          sentry-label="ignore close custom modal button"
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel="Close modal"
          accessibilityHint="Closes the custom feature modal"
        >
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>
          This is an example of how to create your own admin section with modal content.
        </Text>

        <View style={styles.counterSection}>
          <Text style={styles.counterText}>Counter: {counter}</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              sentry-label="ignore increment counter button"
              accessibilityRole="button"
              style={styles.button}
              onPress={() => setCounter((c) => c + 1)}
            >
              <Text style={styles.buttonText}>Increment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              sentry-label="ignore reset counter button"
              accessibilityRole="button"
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setCounter(0)}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={{ paddingBottom: insets.bottom + 20 }} />
    </View>
  );
}

// Example section using the ExpandableSectionWithModal
export function ExampleCustomSection() {
  const [lastOpened, setLastOpened] = useState<Date | null>(null);

  const handleModalOpen = () => {
    setLastOpened(new Date());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <ExpandableSectionWithModal
      icon={Settings}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      title="Custom Feature"
      subtitle={`Example section • ${lastOpened ? `Opened at ${formatTime(lastOpened)}` : 'Never opened'}`}
      onModalOpen={handleModalOpen}
      modalSnapPoints={['80%']}
    >
      {(closeModal) => <MyFeatureModalContent onClose={closeModal} />}
    </ExpandableSectionWithModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  closeButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  description: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  counterSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  counterText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#9CA3AF',
  },
});
