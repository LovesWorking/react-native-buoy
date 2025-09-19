import { Query, useQueryClient } from "@tanstack/react-query";

interface Props {
  query: Query;
  queryClient: ReturnType<typeof useQueryClient>;
}

export default function invalidate({ query, queryClient }: Props) {
  // This matches the ACTION-INVALIDATE case from the external sync system
  queryClient.invalidateQueries(query);
}
