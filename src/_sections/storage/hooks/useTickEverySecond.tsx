import { useEffect, useState } from 'react';

/**
 * Hook that forces a re-render every second
 * Used to update relative timestamps (e.g., "2s ago", "1m ago")
 */
export function useTickEverySecond(enabled: boolean = true) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);
}