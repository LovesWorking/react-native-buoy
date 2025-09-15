import { useState, useCallback } from 'react';

export interface UseToggleReturn {
  isOn: boolean;
  toggle: () => void;
  setOn: () => void;
  setOff: () => void;
  setValue: (value: boolean) => void;
}

/**
 * Custom hook for managing boolean toggle state
 * @param initialValue - Initial toggle state (default: false)
 * @returns Object with toggle state and control functions
 */
export function useToggle(initialValue = false): UseToggleReturn {
  const [isOn, setIsOn] = useState(initialValue);

  const toggle = useCallback(() => {
    setIsOn(prev => !prev);
  }, []);

  const setOn = useCallback(() => {
    setIsOn(true);
  }, []);

  const setOff = useCallback(() => {
    setIsOn(false);
  }, []);

  const setValue = useCallback((value: boolean) => {
    setIsOn(value);
  }, []);

  return {
    isOn,
    toggle,
    setOn,
    setOff,
    setValue,
  };
}