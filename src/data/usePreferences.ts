import { useCallback, useEffect, useState } from 'react';
import { getRepository } from './repository';
import type { Preferences } from './types';

// Loads saved preferences (initializing the repo/anon session once) and exposes a
// save that updates both the backend and local React state.
export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const repo = getRepository();
      await repo.init();
      const prefs = await repo.getPreferences();
      if (active) {
        setPreferences(prefs);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (prefs: Preferences) => {
    await getRepository().savePreferences(prefs);
    setPreferences(prefs);
  }, []);

  return { preferences, loading, save };
}
