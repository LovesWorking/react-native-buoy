import { Query, useQueryClient } from "@tanstack/react-query";

interface Props {
  queryClient: ReturnType<typeof useQueryClient>;
  query: Query;
}
export default function reset({ query, queryClient }: Props) {
  queryClient.resetQueries({
    queryKey: query.queryKey,
    exact: true,
  });
}
