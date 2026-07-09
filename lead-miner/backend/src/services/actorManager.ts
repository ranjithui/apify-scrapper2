import { getProvider } from '../providers/index.js';
import { mapInput } from '../mappers/inputMapper.js';
import { mapOutput } from '../mappers/outputMapper.js';
import { selectChain, getActor, recordHealth } from './actorRegistry.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import type { Actor, NormalizedLead, SearchParams } from '../types/index.js';

export interface RunOutcome {
  actor: Actor;
  providerKey: string;
  externalRunId?: string;
  leads: NormalizedLead[];
  latencyMs: number;
  attempts: number;
}

/**
 * Actor Manager — the orchestration heart.
 *
 * Given a source + search params it:
 *   1. builds the failover chain (active → standby by priority),
 *   2. maps input for the selected actor,
 *   3. runs it through the Provider Abstraction Layer,
 *   4. normalizes output,
 *   5. records health, and
 *   6. on failure, moves to the next actor in the chain IF failover is enabled
 *      (Phase 2). With failover disabled it tries only the first usable actor
 *      (manual switching, Phase 1).
 */
export async function runSource(
  source: string,
  params: SearchParams,
  opts: { forceActorId?: string; failover?: boolean } = {},
): Promise<RunOutcome> {
  const failover = opts.failover ?? env.failoverEnabled;

  let chain: Actor[];
  if (opts.forceActorId) {
    chain = [await getActor(opts.forceActorId)];
  } else {
    chain = await selectChain(source);
  }

  if (chain.length === 0) {
    throw new AppError(
      400,
      `No usable actor configured for source "${source}"`,
      'no_actor',
    );
  }

  const candidates = failover ? chain : chain.slice(0, 1);
  let lastError: unknown;

  for (let i = 0; i < candidates.length; i++) {
    const actor = candidates[i];
    const provider = getProvider(providerKeyFor(actor));
    const input = mapInput(actor, params);

    try {
      logger.info(
        `[actorManager] attempt ${i + 1}/${candidates.length} — ${actor.name}`,
      );
      const result = await provider.run(actor, input);
      const leads = result.items.map((it) =>
        mapOutput(actor, it, provider.key),
      );

      await recordHealth(
        actor.id,
        true,
        result.latencyMs,
        leads.length,
      );

      return {
        actor,
        providerKey: provider.key,
        externalRunId: result.externalRunId,
        leads,
        latencyMs: result.latencyMs,
        attempts: i + 1,
      };
    } catch (err) {
      lastError = err;
      logger.warn(
        `[actorManager] actor ${actor.name} failed: ${(err as Error).message}`,
      );
      await recordHealth(actor.id, false, 0, 0, (err as Error).message);
      // continue to next candidate (failover) or fall through
    }
  }

  throw new AppError(
    502,
    `All actors failed for source "${source}"`,
    'all_actors_failed',
    { cause: (lastError as Error)?.message },
  );
}

// Phase 1: all actors are Apify. When adapters bind actors to other providers
// this will read the provider key from the actor's provider row.
function providerKeyFor(_actor: Actor): string {
  return 'apify';
}
