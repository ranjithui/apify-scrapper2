import type { Actor, ProviderRunResult } from '../types/index.js';

/**
 * Provider Abstraction Layer.
 *
 * The rest of the system talks ONLY to this interface — never to Apify (or
 * any future provider) directly. New providers (Playwright, custom Python
 * scrapers, REST APIs) implement `Provider` and are registered in the
 * ProviderFactory. This is the seam that makes the platform
 * provider-agnostic (Design Principle #1).
 */
export interface Provider {
  /** Stable key matching providers.key in the DB, e.g. 'apify'. */
  readonly key: string;

  /** Whether the provider is usable (credentials present, etc.). */
  isReady(): boolean;

  /**
   * Run an actor with fully-mapped input and return raw items.
   * The caller (ActorManager) handles normalization and failover.
   */
  run(actor: Actor, input: Record<string, unknown>): Promise<ProviderRunResult>;
}
