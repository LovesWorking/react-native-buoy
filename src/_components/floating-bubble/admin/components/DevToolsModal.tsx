import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DevTools from "../../../../DevTools";

const { height: screenHeight } = Dimensions.get("window");

interface DevToolsModalProps {
  visible: boolean;
  queryClient: QueryClient;
  onDismiss: () => void;
}

export function DevToolsModal({
  visible,
  queryClient,
  onDismiss,
}: DevToolsModalProps) {
  const insets = useSafeAreaInsets();
  const availableHeight = screenHeight - insets.top;

  return (
    <Modal
      accessibilityLabel="Dev tools modal"
      accessibilityHint="View dev tools modal"
      sentry-label="ignore dev tools modal"
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <View style={styles.backdrop}>
          <TouchableOpacity
            accessibilityLabel="Dev tools modal backdrop"
            accessibilityHint="View dev tools modal backdrop"
            sentry-label="ignore dev tools modal backdrop"
            style={styles.backdropTouchable}
            onPress={onDismiss}
            activeOpacity={1}
          />
        </View>

        {/* Modal Content */}
        <View style={styles.fullScreenModalContainer}>
          <View
            style={[
              styles.fullScreenModal,
              {
                backgroundColor: "#0F0F0F",
                paddingTop: insets.top,
              },
            ]}
          >
            <View style={styles.directContent}>
              <QueryClientProvider client={queryClient}>
                <DevTools
                  setShowDevTools={onDismiss}
                  containerHeight={availableHeight}
                />
              </QueryClientProvider>
            </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  backdropTouchable: {
    flex: 1,
  },
  fullScreenModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight,
  },
  fullScreenModal: {
    flex: 1,
    minHeight: screenHeight,
  },
  directContent: {
    flex: 1,
  },
});
