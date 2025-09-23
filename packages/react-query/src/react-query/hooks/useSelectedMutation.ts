import { useEffect, useState } from "react";
import { Mutation, useQueryClient } from "@tanstack/react-query";

/**
 * Watches the mutation cache for a specific mutation id. Useful when the UI needs to follow
 * mutation lifecycle events (loading, success, error) for a focused inspection panel.
 */
export function useGetMutationById(mutationId?: number) {
  const queryClient = useQueryClient();
  const [selectedMutation, setSelectedMutation] = useState<
    Mutation | undefined
  >(undefined);

  useEffect(() => {
    const updateSelectedMutation = () => {
      if (mutationId !== undefined) {
        const mutation = queryClient
          .getMutationCache()
          .getAll()
          .find((m) => m.mutationId === mutationId);
        setSelectedMutation(mutation);
      } else {
        setSelectedMutation(undefined);
      }
    };

    setTimeout(updateSelectedMutation, 0);

    const unsubscribe = queryClient
      .getMutationCache()
      .subscribe(updateSelectedMutation);

    return () => unsubscribe();
  }, [queryClient, mutationId]);

  return selectedMutation;
}
