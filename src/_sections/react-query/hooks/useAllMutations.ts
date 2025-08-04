import { useEffect, useRef, useState } from "react";
import { Mutation, useQueryClient } from "@tanstack/react-query";
import isEqual from "fast-deep-equal";

function useAllMutations() {
  const queryClient = useQueryClient();
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const mutationsRef = useRef<Mutation["state"][]>([]);
  useEffect(() => {
    const updateMutations = () => {
      const newMutations = queryClient.getMutationCache().getAll();
      const newStates = newMutations.map((m) => m.state);
      if (!isEqual(mutationsRef.current, newStates)) {
        mutationsRef.current = newStates;
        setTimeout(() => setMutations(newMutations), 0);
      }
    };

    setTimeout(updateMutations, 0);

    const unsubscribe = queryClient
      .getMutationCache()
      .subscribe(updateMutations);

    return () => unsubscribe();
  }, [queryClient]);

  return { mutations };
}

export default useAllMutations;
