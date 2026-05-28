import { getBilling } from './index';
import type { Tier } from './types';

// Entitlement is global app state: a purchase on the paywall must immediately
// unlock content on every other screen. A tiny external store with listeners
// (read via useSyncExternalStore) gives every consumer the same live value.
let tier: Tier = 'free';
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTierSnapshot(): Tier {
  return tier;
}

export function isLoadedSnapshot(): boolean {
  return loaded;
}

export async function loadTier(): Promise<void> {
  const billing = getBilling();
  await billing.init();
  tier = await billing.getTier();
  loaded = true;
  emit();
}

export async function purchase(): Promise<Tier> {
  tier = await getBilling().purchasePremium();
  loaded = true;
  emit();
  return tier;
}

export async function restoreTier(): Promise<Tier> {
  tier = await getBilling().restore();
  loaded = true;
  emit();
  return tier;
}
