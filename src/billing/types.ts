export type Tier = 'free' | 'premium';

// A billing provider abstracts where entitlements come from. For the web
// validation MVP this is a local mock (instant "upgrade"); real billing slots in
// behind the same interface later — Stripe on web, RevenueCat on native — without
// touching the paywall or gating code.
export interface BillingProvider {
  init(): Promise<void>;
  getTier(): Promise<Tier>;
  /** Begin/complete a premium purchase. Returns the resulting tier. */
  purchasePremium(): Promise<Tier>;
  /** Restore a previous purchase. Returns the resulting tier. */
  restore(): Promise<Tier>;
}
