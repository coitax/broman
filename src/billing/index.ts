import { storage } from '@/data/storage';
import { LocalBillingProvider } from './localBilling';
import type { BillingProvider } from './types';

let provider: BillingProvider | null = null;

// Single seam for billing. Swap LocalBillingProvider for a Stripe/RevenueCat
// provider here when real payments land; nothing else changes.
export function getBilling(): BillingProvider {
  if (!provider) provider = new LocalBillingProvider(storage);
  return provider;
}

export { isLocked } from './gating';
export type { Lockable } from './gating';
export type { BillingProvider, Tier } from './types';
