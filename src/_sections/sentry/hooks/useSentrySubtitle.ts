import { useSentryEvents } from "./useSentryEvents";

/**
 * Hook to get Sentry subtitle for display
 * Shows event counts and filtered status
 */
export function useSentrySubtitle() {
  const { totalCount, filteredCount } = useSentryEvents();

  const getSentrySubtitle = () => {
    if (totalCount === 0) {
      return "No events";
    }

    if (filteredCount < totalCount) {
      return `${filteredCount} of ${totalCount} events`;
    }

    return `${totalCount} events`;
  };

  return { getSentrySubtitle };
}
