import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Shield } from "lucide-react-native";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import { AccountAccessSection } from "./sections/AccountAccessSection";
import { DatabaseManagementSection } from "./sections/DatabaseManagementSection";
import { EASUpdateSection } from "./sections/EASUpdateSection";
import { ExplorerTestingSection } from "./sections/ExplorerTestingSection";
import { LogDumpSection } from "./sections/LogDumpSection";
import { UploadTestingSection } from "./sections/UploadTestingSection";

interface Props {
  bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
  onDismiss?: () => void;
}

interface ExplorerTestingOptions {
  isSelfHarm: boolean;
  isInappropriate: boolean;
  isValidProfile: boolean;
  minutesLeft: number;
}

export function AdminModal({ bottomSheetModalRef, onDismiss }: Props) {
  // Upload failure testing states (for UI only)
  const [isBroadcastUploadFailureEnabled, setIsBroadcastUploadFailureEnabled] =
    useState(false);
  const [isMessageUploadFailureEnabled, setIsMessageUploadFailureEnabled] =
    useState(false);

  // Explorer testing states
  const [explorerTestingOptions, setExplorerTestingOptions] =
    useState<ExplorerTestingOptions>({
      isSelfHarm: false,
      isInappropriate: false,
      isValidProfile: true,
      minutesLeft: 5,
    });

  const closeModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, [bottomSheetModalRef]);

  return (
    <BottomSheetModal
      android_keyboardInputMode="adjustResize"
      ref={bottomSheetModalRef}
      index={0}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onDismiss}
      backdropComponent={CustomBackdrop}
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView style={styles.scrollView}>
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.contentContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={24} color="#0EA5E9" />
            </View>
            <Text style={styles.headerText}>Admin Console</Text>
          </View>

          <View style={styles.sectionsContainer}>
            {/* <AccountAccessSection closeModal={closeModal} />

              <UploadTestingSection
                isBroadcastUploadFailureEnabled={
                  isBroadcastUploadFailureEnabled
                }
                isMessageUploadFailureEnabled={isMessageUploadFailureEnabled}
                setIsBroadcastUploadFailureEnabled={
                  setIsBroadcastUploadFailureEnabled
                }
                setIsMessageUploadFailureEnabled={
                  setIsMessageUploadFailureEnabled
                }
              />

              <ExplorerTestingSection
                explorerTestingOptions={explorerTestingOptions}
                setExplorerTestingOptions={setExplorerTestingOptions}
                session={session}
              />

              <EASUpdateSection closeModal={closeModal} session={session} />

              <DatabaseManagementSection />

              <LogDumpSection /> */}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              System Administration • v1.0.4
            </Text>
          </View>
        </Animated.View>
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
  contentContainer: {
    paddingVertical: 32,
  },
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
