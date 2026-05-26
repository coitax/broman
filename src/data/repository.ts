import { LocalRepository } from './localRepository';
import { storage } from './storage';
import { isBackendConfigured } from './supabase';
import { SupabaseRepository } from './supabaseRepository';
import type { Repository } from './types';

let repo: Repository | null = null;

// Picks the backend if env is configured, otherwise the local store. Same
// interface either way, so screens never branch on it.
export function getRepository(): Repository {
  if (!repo) {
    repo = isBackendConfigured ? new SupabaseRepository() : new LocalRepository(storage);
  }
  return repo;
}

export type { Checkin, Completion, Preferences, Repository } from './types';
