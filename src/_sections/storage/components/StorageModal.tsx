import { BaseFloatingModal } from "../../../_components/floating-bubble/modal";
import { BackButton } from "../../../_shared/ui/components/BackButton";
import { StorageBrowserMode } from "./StorageBrowserMode";
import { RequiredStorageKey } from "../types";
import { Text, View } from "react-native";
import { HardDrive } from "lucide-react-native";

interface StorageModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
  requiredStorageKeys?: RequiredStorageKey[];
}

export function StorageModal({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
  requiredStorageKeys = [],
}: StorageModalProps) {
  if (!visible) return null;

  const storagePrefix = enableSharedModalDimensions
    ? "@dev_tools_console_modal"
    : "@devtools_storage_modal";

  const renderHeaderContent = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 12,
        minHeight: 32,
        paddingLeft: 4,
      }}
    >
      {onBack && <BackButton onPress={onBack} />}
      <View
        style={{
          width: 32,
          height: 32,
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HardDrive size={18} color="#10B981" />
      </View>
      <Text
        style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "500", flex: 1 }}
        numberOfLines={1}
      >
        Storage Browser
      </Text>
    </View>
  );

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <StorageBrowserMode 
        selectedQuery={undefined}
        onQuerySelect={() => {}}
        requiredStorageKeys={requiredStorageKeys} 
      />
    </BaseFloatingModal>
  );
}