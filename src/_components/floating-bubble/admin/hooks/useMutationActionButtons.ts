import { useMemo } from "react";
import { Mutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

interface ActionButtonConfig {
  label: string;
  bgColorClass: "btnRefetch" | "btnTriggerLoading" | "btnTriggerLoadiError";
  textColorClass: "btnRefetch" | "btnTriggerLoading" | "btnTriggerLoadiError";
  disabled: boolean;
  onPress: () => void;
}

export function useMutationActionButtons(
  selectedMutation: Mutation
): ActionButtonConfig[] {
  const queryClient = useQueryClient();
  return useMemo(
    () => [
      {
        label: "Remove",
        bgColorClass: "btnTriggerLoadiError",
        textColorClass: "btnTriggerLoadiError",
        disabled: false,
        onPress: () => queryClient.getMutationCache().remove(selectedMutation),
      },
    ],
    [selectedMutation, queryClient]
  );
}
