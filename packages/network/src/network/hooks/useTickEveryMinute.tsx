import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TickContext = createContext<number>(Date.now());

interface TickProviderProps {
  children: ReactNode;
  intervalMs?: number;
}

export function TickProvider({
  children,
  intervalMs = 60_000,
}: TickProviderProps) {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setTick(Date.now());
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);

  return <TickContext.Provider value={tick}>{children}</TickContext.Provider>;
}

export function useTickEveryMinute() {
  const tick = useContext(TickContext);

  // Expose stable object so consumers can memoize on value changes
  return useMemo(() => tick, [tick]);
}
