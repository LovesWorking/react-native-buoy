import { useMemo } from 'react';

type BoolLike = boolean | undefined | null;

function anyOpenFromArray(items: BoolLike[]): boolean {
  for (let i = 0; i < items.length; i++) {
    if (items[i]) return true;
  }
  return false;
}

function anyOpenFromObject(map: Record<string, BoolLike>): boolean {
  for (const key in map) {
    if (Object.prototype.hasOwnProperty.call(map, key) && map[key]) return true;
  }
  return false;
}

/**
 * Convenience hook: returns `true` when any of the provided modal flags are open.
 *
 * Example:
 *   const hidden = useDevToolsVisibility([isEnvOpen, isNetworkOpen]);
 *   // or
 *   const hidden = useDevToolsVisibility({ env: isEnvOpen, network: isNetworkOpen });
 */
export function useDevToolsVisibility(
  modals: BoolLike[] | Record<string, BoolLike>
): boolean {
  return useMemo(() => {
    if (Array.isArray(modals)) return anyOpenFromArray(modals);
    return anyOpenFromObject(modals as Record<string, BoolLike>);
  }, [modals]);
}

