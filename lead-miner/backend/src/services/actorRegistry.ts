import { supabaseAdmin } from '../config/supabase.js';
import type { Actor, ActorStatus } from '../types/index.js';
import { notFound } from '../utils/errors.js';

/**
 * Actor Registry — CRUD + selection over interchangeable actors.
 *
 * Each source (apollo, linkedin, google_maps, website) may have multiple
 * actors ordered by `priority` (1 = highest) with a `status`
 * (active | standby | disabled). Selection returns the ordered failover chain
 * of usable actors for a source.
 */

function rowToActor(r: Record<string, unknown>): Actor {
  return {
    id: r.id as string,
    provider_id: r.provider_id as string,
    source: r.source as string,
    name: r.name as string,
    actor_ref: r.actor_ref as string,
    priority: r.priority as number,
    status: r.status as ActorStatus,
    input_schema: (r.input_schema as Record<string, unknown>) ?? {},
    output_mapping: (r.output_mapping as Record<string, string>) ?? {},
    default_input: (r.default_input as Record<string, unknown>) ?? {},
  };
}

export async function listActors(source?: string): Promise<Actor[]> {
  let q = supabaseAdmin
    .from('actors')
    .select('*')
    .order('source', { ascending: true })
    .order('priority', { ascending: true });
  if (source) q = q.eq('source', source);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToActor);
}

export async function getActor(id: string): Promise<Actor> {
  const { data, error } = await supabaseAdmin
    .from('actors')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) throw notFound(`Actor ${id} not found`);
  return rowToActor(data);
}

/**
 * Ordered failover chain for a source: the `active` actor first, then any
 * `standby` actors by ascending priority. `disabled` actors are excluded.
 */
export async function selectChain(source: string): Promise<Actor[]> {
  const actors = await listActors(source);
  const usable = actors.filter((a) => a.status !== 'disabled');
  return usable.sort((a, b) => {
    const rank = (s: ActorStatus) => (s === 'active' ? 0 : 1);
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return a.priority - b.priority;
  });
}

export async function createActor(
  input: Partial<Actor> & { provider_id: string; source: string; name: string; actor_ref: string },
): Promise<Actor> {
  const { data, error } = await supabaseAdmin
    .from('actors')
    .insert({
      provider_id: input.provider_id,
      source: input.source,
      name: input.name,
      actor_ref: input.actor_ref,
      priority: input.priority ?? 1,
      status: input.status ?? 'standby',
      input_schema: input.input_schema ?? {},
      output_mapping: input.output_mapping ?? {},
      default_input: input.default_input ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToActor(data);
}

export async function updateActor(
  id: string,
  patch: Partial<Actor>,
): Promise<Actor> {
  const allowed = [
    'name',
    'actor_ref',
    'priority',
    'status',
    'input_schema',
    'output_mapping',
    'default_input',
  ] as const;
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in patch) update[k] = (patch as Record<string, unknown>)[k];
  }
  const { data, error } = await supabaseAdmin
    .from('actors')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw notFound(`Actor ${id} not found`);
  return rowToActor(data);
}

export async function deleteActor(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('actors').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Manual actor switching (Phase 1): make one actor `active` for its source and
 * demote the current active one to `standby`.
 */
export async function activateActor(id: string): Promise<Actor> {
  const actor = await getActor(id);
  await supabaseAdmin
    .from('actors')
    .update({ status: 'standby' })
    .eq('source', actor.source)
    .eq('status', 'active');
  return updateActor(id, { status: 'active' });
}

/** Record a health data point (used by ActorManager & Phase 2 monitoring). */
export async function recordHealth(
  actorId: string,
  success: boolean,
  latencyMs: number,
  leadsCount: number,
  error?: string,
): Promise<void> {
  await supabaseAdmin.from('actor_health').insert({
    actor_id: actorId,
    success,
    latency_ms: latencyMs,
    leads_count: leadsCount,
    error: error ?? null,
  });
}
