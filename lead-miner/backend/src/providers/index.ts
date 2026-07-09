import type { Provider } from './Provider.js';
import { ApifyProvider } from './ApifyProvider.js';
import { AppError } from '../utils/errors.js';

/**
 * ProviderFactory — the registry of provider implementations.
 * Phase 3 will add PlaywrightProvider, CustomApiProvider, etc. here without
 * touching any calling code.
 */
const registry = new Map<string, Provider>();

function register(p: Provider) {
  registry.set(p.key, p);
}

// Phase 1: Apify only.
register(new ApifyProvider());
// register(new PlaywrightProvider());   // Phase 3
// register(new CustomApiProvider());    // Phase 3

export function getProvider(key: string): Provider {
  const p = registry.get(key);
  if (!p) {
    throw new AppError(400, `Unknown provider "${key}"`, 'unknown_provider');
  }
  return p;
}

export function listProviders(): Provider[] {
  return [...registry.values()];
}

export type { Provider };
