import { useEffect, useState, useRef, useMemo } from "react";
import isEqual from "fast-deep-equal";
import { ConsoleTransportEntry, LogLevel, LogType } from "../logger/types";

import { reactiveSentryEventStore } from "../../sentry/sentryEventStore";
import { adaptSentryEventsToConsoleEntries } from "../sections/log-dump/SentryEventAdapter";

interface UseSentryEventsOptions {
  selectedTypes?: Set<LogType>;
  selectedLevels?: Set<LogLevel>;
}

/**
 * Reactive hook for Sentry events with automatic updates
 * Following React Query patterns [[memory:4875074]]
 */
export function useSentryEvents(options: UseSentryEventsOptions = {}) {
  const { selectedTypes = new Set(), selectedLevels = new Set() } = options;

  // State for the adapted entries
  const [entries, setEntries] = useState<ConsoleTransportEntry[]>([]);

  // Ref to track previous state for comparison
  const entriesRef = useRef<unknown[]>([]);

  // Calculate and filter entries - memoized to avoid recreation
  const calculateEntries = useMemo(
    () => () => {
      const rawSentryEvents = reactiveSentryEventStore.getEvents();
      const adaptedEntries = adaptSentryEventsToConsoleEntries(rawSentryEvents);

      // Remove duplicates based on ID
      const uniqueEntries = adaptedEntries.reduce(
        (acc: ConsoleTransportEntry[], entry: ConsoleTransportEntry) => {
          if (
            !acc.some(
              (existing: ConsoleTransportEntry) => existing.id === entry.id
            )
          ) {
            acc.push(entry);
          }
          return acc;
        },
        [] as ConsoleTransportEntry[]
      );

      return uniqueEntries.sort(
        (a: ConsoleTransportEntry, b: ConsoleTransportEntry) =>
          b.timestamp - a.timestamp
      );
    },
    []
  );

  // Subscribe to store changes
  useEffect(() => {
    const updateEntries = () => {
      const newEntries = calculateEntries();
      const newStates = newEntries.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
      }));

      // Only update if entries actually changed
      if (!isEqual(entriesRef.current, newStates)) {
        entriesRef.current = newStates;
        setEntries(newEntries);
      }
    };

    // Initial update - deferred to avoid render phase updates
    setTimeout(updateEntries, 0);

    // Subscribe to reactive store - will auto-update when new events arrive
    const unsubscribe = reactiveSentryEventStore.subscribe(updateEntries);

    return () => unsubscribe();
  }, [calculateEntries]); // Add calculateEntries as dependency since it's used in the effect

  // Memoized filtering to prevent expensive recalculation [[memory:4875251]]
  const filteredEntries = useMemo(() => {
    if (selectedTypes.size === 0 && selectedLevels.size === 0) {
      return entries;
    }

    return entries.filter((entry) => {
      const typeMatch =
        selectedTypes.size === 0 || selectedTypes.has(entry.type);
      const levelMatch =
        selectedLevels.size === 0 || selectedLevels.has(entry.level);
      return typeMatch && levelMatch;
    });
  }, [entries, selectedTypes, selectedLevels]);

  return {
    entries: filteredEntries,
    totalCount: entries.length,
    filteredCount: filteredEntries.length,
    maxEvents: reactiveSentryEventStore.getMaxEvents(),
  };
}

/**
 * Hook to get Sentry event counts by type and level
 * Reactive updates when events change
 */
export function useSentryEventCounts() {
  const [counts, setCounts] = useState({
    byType: {} as Record<LogType, number>,
    byLevel: {} as Record<LogLevel, number>,
  });

  useEffect(() => {
    const updateCounts = () => {
      const events = reactiveSentryEventStore.getEvents();
      const adaptedEntries = adaptSentryEventsToConsoleEntries(events);

      // Count by type
      const byType = adaptedEntries.reduce(
        (acc, entry) => {
          acc[entry.type] = (acc[entry.type] || 0) + 1;
          return acc;
        },
        {} as Record<LogType, number>
      );

      // Count by level
      const byLevel = adaptedEntries.reduce(
        (acc, entry) => {
          acc[entry.level] = (acc[entry.level] || 0) + 1;
          return acc;
        },
        {} as Record<LogLevel, number>
      );

      setCounts({ byType, byLevel });
    };

    // Initial update - deferred to avoid render phase updates
    setTimeout(updateCounts, 0);

    // Subscribe to reactive store
    const unsubscribe = reactiveSentryEventStore.subscribe(updateCounts);

    return () => unsubscribe();
  }, []);

  return counts;
}
