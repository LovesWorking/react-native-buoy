import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type StateContext = number;
const TickContext = createContext<StateContext>(0);

/**
 * Tick provider that updates every second for accurate relative timestamps
 * Standard for log lists: update every second for times < 1 minute
 */
export function TickProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    // Update every second for accurate "Xs ago" display
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return <TickContext.Provider value={tick}>{children}</TickContext.Provider>;
}

export function useTickEveryMinute() {
  return useContext(TickContext);
}

// More descriptive alias for the hook
export const useRelativeTimeTick = useTickEveryMinute;
