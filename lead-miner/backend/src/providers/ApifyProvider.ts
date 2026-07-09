import { ApifyClient } from 'apify-client';
import type { Provider } from './Provider.js';
import type { Actor, ProviderRunResult } from '../types/index.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Apify implementation of the Provider interface (Phase 1 provider).
 * Wraps the official apify-client. Actor selection, input mapping and output
 * normalization all live outside this class — it just runs one actor.
 */
export class ApifyProvider implements Provider {
  readonly key = 'apify';
  private client: ApifyClient | null;

  constructor(token = env.apifyToken) {
    this.client = token ? new ApifyClient({ token }) : null;
  }

  isReady(): boolean {
    return this.client !== null;
  }

  async run(
    actor: Actor,
    input: Record<string, unknown>,
  ): Promise<ProviderRunResult> {
    if (!this.client) {
      throw new AppError(
        500,
        'Apify token not configured (APIFY_TOKEN)',
        'provider_not_ready',
      );
    }

    const start = Date.now();
    logger.info(`[apify] running actor ${actor.actor_ref}`, { input });

    // Kick off the run and wait for it to finish.
    const run = await this.client.actor(actor.actor_ref).call(input, {
      // reasonable defaults; a scheduler (Phase 2) may override
      memory: 1024,
      timeout: 300,
    });

    if (!run || !run.defaultDatasetId) {
      throw new AppError(
        502,
        `Apify actor ${actor.actor_ref} returned no dataset`,
        'provider_run_failed',
      );
    }

    if (run.status !== 'SUCCEEDED') {
      throw new AppError(
        502,
        `Apify run ${run.id} ended with status ${run.status}`,
        'provider_run_failed',
        { runId: run.id, status: run.status },
      );
    }

    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();

    return {
      items: items as Array<Record<string, unknown>>,
      externalRunId: run.id,
      latencyMs: Date.now() - start,
    };
  }
}
