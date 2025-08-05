import { HardDrive } from "lucide-react-native";
import { ConsoleSection } from "../../../_components/floating-bubble/console/ConsoleSection";
import { useStorageQueryCounts } from "../../react-query/hooks/useStorageQueryCounts";

interface StorageSectionProps {
  onPress: () => void;
}

/**
 * Storage section component for the dev tools console.
 * Shows storage statistics and provides access to storage browser.
 */
export function StorageSection({ onPress }: StorageSectionProps) {
  const { total, mmkv, async, secure } = useStorageQueryCounts();

  const getStorageSubtitle = () => {
    if (total === 0) {
      return "No storage entries";
    }
    
    const parts = [];
    if (mmkv > 0) parts.push(`${mmkv} MMKV`);
    if (async > 0) parts.push(`${async} Async`);
    if (secure > 0) parts.push(`${secure} Secure`);
    
    return parts.join(", ");
  };

  return (
    <ConsoleSection
      id="storage"
      title="Storage"
      subtitle={getStorageSubtitle()}
      icon={HardDrive}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      onPress={onPress}
    />
  );
}