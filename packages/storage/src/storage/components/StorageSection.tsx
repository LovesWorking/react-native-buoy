import { HardDrive } from "rn-better-dev-tools/icons";
import { CyberpunkSectionButton } from "@/rn-better-dev-tools/src/shared/ui/console/CyberpunkSectionButton";
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
      return "Empty";
    }

    // Shorter format: just show the most used type
    if (async > 0) return `${async} Async`;
    if (mmkv > 0) return `${mmkv} MMKV`;
    if (secure > 0) return `${secure} Secure`;

    return `${total} items`;
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
