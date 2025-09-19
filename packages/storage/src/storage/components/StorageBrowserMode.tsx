import { Query } from "@tanstack/react-query";
import { RequiredStorageKey } from "../types";
import { GameUIStorageBrowser } from "./GameUIStorageBrowser";

interface StorageBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
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
