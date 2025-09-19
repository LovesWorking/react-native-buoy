import { Query } from "@tanstack/react-query";

interface Props {
  query: Query;
}

export default function triggerLoading({ query }: Props) {
  if (query.state.data === undefined) {
    // --ACTION-RESTORE-LOADING logic--
    // This matches the ACTION-RESTORE-LOADING case from the external sync system
    const previousState = query.state;
    const previousOptions = query.state.fetchMeta
      ? (
          query.state.fetchMeta as unknown as {
            __previousQueryOptions: unknown;
          }
        ).__previousQueryOptions
      : null;

    query.cancel({ silent: true });
    query.setState({
      ...previousState,
      fetchStatus: "idle",
      fetchMeta: null,
    });

    if (previousOptions) {
      query.fetch(previousOptions);
    }
  } else {
    // --ACTION-TRIGGER-LOADING logic--
    // This matches the ACTION-TRIGGER-LOADING case from the external sync system
    const __previousQueryOptions = query.options;

    // Trigger a fetch in order to trigger suspense as well.
    query.fetch({
      ...__previousQueryOptions,
      queryFn: () => {
        return new Promise(() => {
          // Never resolve - simulates perpetual loading
        });
      },
      gcTime: -1,
    });

    query.setState({
      data: undefined,
      status: "pending",
      fetchMeta: {
        ...query.state.fetchMeta,
        // @ts-expect-error This does exist
        __previousQueryOptions,
      },
    });
  }
}
