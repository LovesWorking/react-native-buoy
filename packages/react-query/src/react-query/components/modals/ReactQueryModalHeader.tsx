import { Query, Mutation } from "@tanstack/react-query";
import { ModalHeader } from "@react-buoy/shared-ui";
import { TabSelector } from "@react-buoy/shared-ui";

interface ReactQueryModalHeaderProps {
  selectedQuery?: Query;
  selectedMutation?: Mutation;
  activeTab: "queries" | "mutations";
  onTabChange: (tab: "queries" | "mutations") => void;
  onBack: () => void;
  onClose?: () => void;
}

export function ReactQueryModalHeader({
  selectedQuery,
  selectedMutation,
  activeTab,
  onTabChange,
  onBack,
  onClose,
}: ReactQueryModalHeaderProps) {
  // Simple function to get query display text
  const getQueryText = (query: Query) => {
    if (!query?.queryKey) return "Unknown Query";
    const keys = Array.isArray(query.queryKey)
      ? query.queryKey
      : [query.queryKey];
    return (
      keys
        .filter((k) => k != null)
        .map((k) => String(k))
        .join(" › ") || "Unknown Query"
    );
  };

  const getItemText = (item: Query | Mutation) => {
    if ("queryKey" in item) {
      return getQueryText(item);
    } else {
      return item.options.mutationKey
        ? (Array.isArray(item.options.mutationKey)
            ? item.options.mutationKey
            : [item.options.mutationKey]
          )
            .filter((k) => k != null)
            .map((k) => String(k))
            .join(" › ") || `Mutation #${item.mutationId}`
        : `Mutation #${item.mutationId}`;
    }
  };

  const tabs = [
    { key: "queries" as const, label: "Queries" },
    { key: "mutations" as const, label: "Mutations" },
  ];

  // Show details view when an item is selected
  if (selectedQuery || selectedMutation) {
    return (
      <ModalHeader>
        <ModalHeader.Navigation onBack={onBack} onClose={onClose} />
        <ModalHeader.Content
          title={getItemText(selectedQuery ?? selectedMutation!)}
        />
      </ModalHeader>
    );
  }

  // Show browser view with tabs when no item is selected
  return (
    <ModalHeader>
      <ModalHeader.Content title="" noMargin>
        <TabSelector
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => onTabChange(tab as "queries" | "mutations")}
        />
      </ModalHeader.Content>
      {onClose && <ModalHeader.Actions onClose={onClose} />}
    </ModalHeader>
  );
}
