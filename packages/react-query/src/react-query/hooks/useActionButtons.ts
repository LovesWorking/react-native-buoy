import { useMemo } from "react";
import { Query, QueryClient } from "@tanstack/react-query";
import triggerLoading from "../utils/actions/triggerLoading";
import refetch from "../utils/actions/refetch";
import triggerError from "../utils/actions/triggerError";
import { getQueryStatusLabel } from "../utils/getQueryStatusLabel";

interface ActionButtonConfig {
  label: string;
  bgColorClass:
    | "btnRefetch"
    | "btnTriggerLoading"
    | "btnTriggerLoadiError"
    | "btnRemove";
  textColorClass:
    | "btnRefetch"
    | "btnTriggerLoading"
    | "btnTriggerLoadiError"
    | "btnRemove";
  disabled: boolean;
  onPress: () => void;
}

export function useActionButtons(
  selectedQuery: Query,
  queryClient: QueryClient
): ActionButtonConfig[] {
  const actionButtons = useMemo(() => {
    const queryStatus = selectedQuery.state.status;
    const isFetching = getQueryStatusLabel(selectedQuery) === "fetching";

    const buttons: ActionButtonConfig[] = [
      {
        label: "Refetch",
        bgColorClass: "btnRefetch" as const,
        textColorClass: "btnRefetch" as const,
        disabled: isFetching,
        onPress: () => refetch({ query: selectedQuery }),
      },
      {
        label:
          selectedQuery.state.fetchStatus === "fetching"
            ? "Restore"
            : "Loading",
        bgColorClass: "btnTriggerLoading" as const,
        textColorClass: "btnTriggerLoading" as const,
        disabled: false,
        onPress: () => triggerLoading({ query: selectedQuery }),
      },
      {
        label: queryStatus === "error" ? "Restore" : "Error",
        bgColorClass: "btnTriggerLoadiError" as const,
        textColorClass: "btnTriggerLoadiError" as const,
        disabled: queryStatus === "pending",
        onPress: () => triggerError({ query: selectedQuery, queryClient }),
      },
    ];
    return buttons;
  }, [
    selectedQuery,
    queryClient,
    selectedQuery.queryHash,
    selectedQuery.state.status,
    selectedQuery.state.fetchStatus,
    selectedQuery.state.dataUpdatedAt,
    selectedQuery.state.errorUpdatedAt,
    selectedQuery.state.isInvalidated,
  ]);
  return actionButtons;
}
