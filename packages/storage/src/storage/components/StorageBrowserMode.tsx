import { RequiredStorageKey } from "../types";
import { GameUIStorageBrowser } from "./GameUIStorageBrowser";

interface StorageBrowserModeProps {
  requiredStorageKeys?: RequiredStorageKey[]; // Configuration for required keys
}

/**
 * Storage browser mode component
 * Displays storage keys with game UI styled interface
 */
export function StorageBrowserMode({
  requiredStorageKeys = [],
}: StorageBrowserModeProps) {
  return (
    <GameUIStorageBrowser
      requiredStorageKeys={requiredStorageKeys}
    />
  );
}
