import { useState, useEffect } from "react";
import { getSentryEvents } from "../../sentry/sentryEventListeners";
import { formatRelativeTime } from "../sections/log-dump/utils";

/**
 * Custom hook for managing sentry events state and providing dynamic subtitle
 * Extracts reusable sentry events logic following composition principles
 */
export function useSentryEvents() {
  const [sentryEntries, setSentryEntries] = useState(() => getSentryEvents());

  // Update sentry entries periodically
  useEffect(() => {
    const updateSentryEntries = () => {
      const rawEntries = getSentryEvents();
      // Remove duplicates based on ID
      const uniqueEntries = rawEntries.reduce((acc: any[], entry: any) => {
        if (!acc.some((existing: any) => existing.id === entry.id)) {
          acc.push(entry);
        }
        return acc;
      }, [] as any[]);
      setSentryEntries(
        uniqueEntries.sort((a: any, b: any) => b.timestamp - a.timestamp)
      );
    };

    updateSentryEntries();
    const interval = setInterval(updateSentryEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate dynamic subtitle
  const getSentrySubtitle = () => {
    return `${sentryEntries.length} events • Last ${
      sentryEntries.length > 0
        ? formatRelativeTime(sentryEntries[0]?.timestamp)
        : "never"
    }`;
  };

  return {
    sentryEntries,
    getSentrySubtitle,
  };
}
