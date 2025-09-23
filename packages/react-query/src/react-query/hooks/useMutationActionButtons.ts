import { useMemo } from "react";
import { Mutation , useQueryClient } from "@tanstack/react-query";

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
 * Supplies action button metadata for a selected mutation. Currently exposes a remove control but
 * centralizes logic so future actions stay consistent across the UI.
 */
export function useMutationActionButtons(
  selectedMutation: Mutation,
): ActionButtonConfig[] {
  const queryClient = useQueryClient();
  return useMemo(
    () => [
      {
        label: "Remove",
        bgColorClass: "btnRemove",
        textColorClass: "btnRemove",
        disabled: false,
        onPress: () => queryClient.getMutationCache().remove(selectedMutation),
      },
    ],
    [selectedMutation, queryClient],
  );
}
