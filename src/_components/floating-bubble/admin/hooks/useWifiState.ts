import { useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';

export function useWifiState() {
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  const handleWifiToggle = () => {
    const newOnlineState = !isOnline;
    setIsOnline(newOnlineState);
    onlineManager.setOnline(newOnlineState);
  };

  // Listen to online manager changes to keep state in sync
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return {
    isOnline,
    handleWifiToggle,
  };
}
