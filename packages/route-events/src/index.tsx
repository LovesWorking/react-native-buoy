import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  JsModal,
  ModalHeader,
  macOSColors,
  devToolsStorageKeys,
} from "@react-buoy/shared-ui";

export interface RouteEventsModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

export const RouteEventsModal = ({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
}: RouteEventsModalProps) => {
  if (!visible) return null;

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : "route-events-modal";

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: (
          <ModalHeader>
            {onBack && <ModalHeader.Navigation onBack={onBack} />}
            <ModalHeader.Content title="Route Events" />
            <ModalHeader.Actions onClose={onClose} />
          </ModalHeader>
        ),
      }}
      onModeChange={() => {}}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
    >
      <View style={styles.container}>
        <View style={styles.todoBox}>
          <Text style={styles.todoText}>TODO</Text>
          <Text style={styles.description}>
            Route event tracking will be implemented here
          </Text>
        </View>
      </View>
    </JsModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  todoBox: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: macOSColors.border.input,
    borderStyle: "dashed",
  },
  todoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    letterSpacing: 4,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    textAlign: "center",
  },
});
