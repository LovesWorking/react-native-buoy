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

/**
 * Derives the default action button configuration for an inspected query. Encapsulates business
 * rules around when to show refetch, loading, or error simulation actions.
 *
 * @param selectedQuery - The query to derive actions for
 * @param queryClient - The query client for executing actions
 * @param queryVersion - Optional version number that increments on query state changes.
 *                       React Query mutates Query objects in place, so this version ensures
 *                       the useMemo recomputes when state changes.
 */
export function useActionButtons(
  selectedQuery: Query,
  queryClient: QueryClient,
  queryVersion?: number
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
    // queryVersion is the key dependency that ensures this recomputes when query state changes.
    // React Query mutates Query objects in place, so comparing selectedQuery.state.* values
    // doesn't work reliably (the "previous" and "current" values read from the same mutated object).
  }, [selectedQuery, queryClient, queryVersion]);
  return actionButtons;
}
