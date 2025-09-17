import { Query } from "@tanstack/react-query";

interface Props {
  query: Query;
}

export default function refetch({ query }: Props) {
  // This matches the ACTION-REFETCH case from the external sync system
  const promise = query.fetch();
  promise.catch(() => {
    // Silently handle fetch errors
  });
}
