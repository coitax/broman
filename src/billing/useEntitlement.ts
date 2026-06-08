import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { track } from '@/analytics';
import * as store from './store';

export function useEntitlement() {
  const tier = useSyncExternalStore(store.subscribe, store.getTierSnapshot, store.getTierSnapshot);
  const loaded = useSyncExternalStore(store.subscribe, store.isLoadedSnapshot, store.isLoadedSnapshot);

  useEffect(() => {
    if (!loaded) void store.loadTier();
  }, [loaded]);

  const upgrade = useCallback(async () => {
    const next = await store.purchase();
    if (next === 'premium') track({ name: 'premium_unlocked' });
    return next;
  }, []);

  const restore = useCallback(() => store.restoreTier(), []);

  return { tier, isPremium: tier === 'premium', loading: !loaded, upgrade, restore };
}
