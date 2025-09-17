import { Query, QueryClient } from "@tanstack/react-query";

interface Props {
  query: Query;
  queryClient: QueryClient;
}

export default function triggerError({ query, queryClient }: Props) {
  if (query.state.status !== "error") {
    // --ACTION-TRIGGER-ERROR logic--
    // This matches the ACTION-TRIGGER-ERROR case from the external sync system
    const error = new Error("Unknown error from devtools");
    const __previousQueryOptions = query.options;

    query.setState({
      status: "error",
      error,
      fetchMeta: {
        ...query.state.fetchMeta,
        // @ts-expect-error This does exist
        __previousQueryOptions,
      },
    });
  } else {
    // --ACTION-RESTORE-ERROR logic--
    // This matches the ACTION-RESTORE-ERROR case from the external sync system
    queryClient.resetQueries(query);
  }
}
