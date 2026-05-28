import type { KeyValueStore } from '@/data/storage';
import type { BillingProvider, Tier } from './types';

const KEY = 'morning.tier';

// Validation-stage billing: "purchase" instantly grants premium and persists it.
// This stands in for real payments while we test whether people value premium at
// all; replace with Stripe (web) / RevenueCat (native) once that's proven.
export class LocalBillingProvider implements BillingProvider {
  constructor(private readonly store: KeyValueStore) {}

  async init(): Promise<void> {}

  async getTier(): Promise<Tier> {
    return (await this.store.getItem(KEY)) === 'premium' ? 'premium' : 'free';
  }

  async purchasePremium(): Promise<Tier> {
    await this.store.setItem(KEY, 'premium');
    return 'premium';
  }

  async restore(): Promise<Tier> {
    return this.getTier();
  }
}
