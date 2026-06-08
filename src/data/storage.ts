// Key-value store abstraction. Native default is in-memory for Phase 1; Phase 2
// swaps in @react-native-async-storage/async-storage behind the same interface.
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const mem = new Map<string, string>();

export const storage: KeyValueStore = {
  async getItem(key) {
    return mem.has(key) ? (mem.get(key) as string) : null;
  },
  async setItem(key, value) {
    mem.set(key, value);
  },
};
