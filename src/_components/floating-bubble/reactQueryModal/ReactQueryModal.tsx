import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Query, QueryKey } from "@tanstack/react-query";
import { BaseFloatingModal } from "../floatingModal/BaseFloatingModal";
import { useGetQueryByQueryKey } from "../../_hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { QueryBrowserMode } from "../admin/components/QueryBrowserMode";
import { DataEditorMode } from "../admin/components/DataEditorMode";

interface ReactQueryModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
}

export function ReactQueryModal({
  visible,
  selectedQueryKey,
  onQuerySelect,
  onClose,
}: ReactQueryModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedQuery={selectedQuery}
      activeFilter={activeFilter}
      onQuerySelect={onQuerySelect}
      onFilterChange={setActiveFilter}
    />
  );

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@floating_data_editor"
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      <View style={styles.content}>
        {selectedQuery ? (
          <DataEditorMode selectedQuery={selectedQuery} />
        ) : (
          <QueryBrowserMode
            selectedQuery={selectedQuery}
            onQuerySelect={onQuerySelect}
            activeFilter={activeFilter}
          />
        )}
      </View>
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },
});
