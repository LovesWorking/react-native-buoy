import { useMemo } from "react";
import { Query, QueryClient } from "@tanstack/react-query";
import triggerLoading from "../utils/actions/triggerLoading";
import refetch from "../utils/actions/refetch";
import triggerError from "../utils/actions/triggerError";
import { getQueryStatusLabel } from "../utils/getQueryStatusLabel";

interface ActionButtonConfig {
  label: string;
  bgColorClass: "btnRefetch" | "btnTriggerLoading" | "btnTriggerLoadiError";
  textColorClass: "btnRefetch" | "btnTriggerLoading" | "btnTriggerLoadiError";
  disabled: boolean;
  onPress: () => void;
}

export function useActionButtons(
  selectedQuery: Query,
  queryClient: QueryClient
): ActionButtonConfig[] {
  return useMemo(() => {
    const queryStatus = selectedQuery.state.status;
    const isFetching = getQueryStatusLabel(selectedQuery) === "fetching";

    return [
      {
        label: "Refetch",
        bgColorClass: "btnRefetch" as const,
        textColorClass: "btnRefetch" as const,
        disabled: isFetching,
        onPress: () => refetch({ query: selectedQuery }),
      },
      {
        label: selectedQuery.state.data === undefined ? "Restore" : "Loading",
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
  }, [selectedQuery, queryClient]);
}
