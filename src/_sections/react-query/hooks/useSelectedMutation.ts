import { useEffect, useState } from "react";
import { Mutation, useQueryClient } from "@tanstack/react-query";

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
