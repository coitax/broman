import type { Tier } from './types';

export interface Lockable {
  premium?: boolean;
}

/** A premium item is locked unless the user is on the premium tier. */
export function isLocked(item: Lockable, tier: Tier): boolean {
  return Boolean(item.premium) && tier !== 'premium';
}
