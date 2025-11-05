import { HardDrive, CyberpunkSectionButton } from "@react-buoy/shared-ui";
import { useAsyncStorageKeys } from "../hooks/useAsyncStorageKeys";
import { isDevToolsStorageKey } from "@react-buoy/shared-ui";

interface StorageSectionProps {
  onPress: () => void;
}

/**
 * Storage section component for the dev tools console.
 * Shows storage statistics and provides access to storage browser.
 */
export function StorageSection({ onPress }: StorageSectionProps) {
  const { storageKeys } = useAsyncStorageKeys();

  // Filter out dev tool keys for the count
  const appKeys = storageKeys.filter((k) => !isDevToolsStorageKey(k.key));
  const asyncCount = appKeys.length;
  const total = asyncCount;

  const getStorageSubtitle = () => {
    if (total === 0) {
      return "Empty";
    }

    // For now, only AsyncStorage is supported
    return `${asyncCount} Async`;
  };

  return (
    <CyberpunkSectionButton
      id="storage"
      title="STORAGE"
      subtitle={getStorageSubtitle()}
      icon={HardDrive}
      iconColor="#00FF88"
      iconBackgroundColor="rgba(0, 255, 136, 0.1)"
      onPress={onPress}
      index={2}
    />
  );
}
