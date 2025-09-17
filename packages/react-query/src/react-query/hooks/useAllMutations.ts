import { useEffect, useRef, useState } from "react";
import { Mutation, useQueryClient } from "@tanstack/react-query";

function useAllMutations() {
  const queryClient = useQueryClient();
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const mutationsSnapshotRef = useRef<string | null>(null);
  useEffect(() => {
    const updateMutations = () => {
      const newMutations = queryClient.getMutationCache().getAll();
      const newStates = newMutations.map((m) => m.state);
      const snapshot = JSON.stringify(newStates);
      if (mutationsSnapshotRef.current !== snapshot) {
        mutationsSnapshotRef.current = snapshot;
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
