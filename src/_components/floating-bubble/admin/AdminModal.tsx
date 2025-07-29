import { StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Terminal } from "lucide-react-native";

interface Props {
  bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export function AdminModal({
  bottomSheetModalRef,
  onDismiss,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal
      sentry-label="ignore Admin modal"
      android_keyboardInputMode="adjustResize"
      ref={bottomSheetModalRef}
      index={0}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onDismiss}
      backdropComponent={CustomBackdrop}
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
      style={{
        marginTop: insets.top,
      }}
    >
      <BottomSheetScrollView
        sentry-label="ignore admin modal scroll view"
        style={styles.scrollView}
      >
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Terminal size={16} color="#0EA5E9" />
            </View>
            <Text style={styles.headerText}>Debug Console</Text>
          </View>

          <View style={styles.sectionsContainer}>{children}</View>

          {/* Bottom safe area padding */}
          <View style={{ paddingBottom: insets.bottom }} />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function CustomBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
      opacity={0.8}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalBackground: {
    backgroundColor: "#171717",
  },
  handleIndicator: {
    backgroundColor: "#6B7280",
    width: 40,
    height: 5,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  contentContainer: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 12,
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
  sectionsContainer: {
    marginHorizontal: 8,
    gap: 16,
    marginBottom: 64,
  },
  footer: {
    marginTop: 40,
    marginBottom: 8,
  },
  footerText: {
    color: "#4B5563",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
});
