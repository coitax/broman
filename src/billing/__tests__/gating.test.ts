import { isLocked } from '@/billing/gating';

describe('isLocked', () => {
  it('locks premium items for free users', () => {
    expect(isLocked({ premium: true }, 'free')).toBe(true);
  });

  it('unlocks premium items for premium users', () => {
    expect(isLocked({ premium: true }, 'premium')).toBe(false);
  });

  it('never locks free items', () => {
    expect(isLocked({ premium: false }, 'free')).toBe(false);
    expect(isLocked({}, 'free')).toBe(false);
  });
});
