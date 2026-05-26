import { LocalRepository } from '@/data/localRepository';
import type { KeyValueStore } from '@/data/storage';

function memStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    async getItem(k) {
      return map.has(k) ? (map.get(k) as string) : null;
    },
    async setItem(k, v) {
      map.set(k, v);
    },
  };
}

describe('LocalRepository', () => {
  it('round-trips preferences', async () => {
    const repo = new LocalRepository(memStore());
    expect(await repo.getPreferences()).toBeNull();
    await repo.savePreferences({ totalMinutes: 15, intensity: 'gentle', movementStyle: 'taichi' });
    expect(await repo.getPreferences()).toEqual({
      totalMinutes: 15,
      intensity: 'gentle',
      movementStyle: 'taichi',
    });
  });

  it('overwrites preferences on re-save', async () => {
    const repo = new LocalRepository(memStore());
    await repo.savePreferences({ totalMinutes: 5, intensity: 'gentle', movementStyle: 'yoga' });
    await repo.savePreferences({ totalMinutes: 20, intensity: 'energizing', movementStyle: 'either' });
    expect((await repo.getPreferences())?.totalMinutes).toBe(20);
  });

  it('appends check-ins with a timestamp without losing prior ones', async () => {
    const store = memStore();
    const repo = new LocalRepository(store);
    await repo.saveCheckin({ mood: 'Hopeful', phase: 'post' });
    await repo.saveCheckin({ mood: 'Calm', phase: 'pre' });
    const stored = JSON.parse((await store.getItem('morning.checkins')) ?? '[]');
    expect(stored).toHaveLength(2);
    expect(stored[0].mood).toBe('Hopeful');
    expect(typeof stored[0].at).toBe('string');
  });

  it('records completions', async () => {
    const store = memStore();
    const repo = new LocalRepository(store);
    await repo.recordCompletion({ journeyId: 'sunrise-flow', totalSec: 600 });
    const stored = JSON.parse((await store.getItem('morning.completions')) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ journeyId: 'sunrise-flow', totalSec: 600 });
  });

  it('survives corrupt stored data', async () => {
    const store = memStore();
    await store.setItem('morning.checkins', 'not json');
    const repo = new LocalRepository(store);
    await expect(repo.saveCheckin({ mood: 'Tired', phase: 'post' })).resolves.toBeUndefined();
    const stored = JSON.parse((await store.getItem('morning.checkins')) ?? '[]');
    expect(stored).toHaveLength(1);
  });
});
