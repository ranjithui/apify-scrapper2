import { supabaseAdmin } from '../config/supabase.js';
import { runSource } from './actorManager.js';
import { processLeads } from './leadProcessor.js';
import { jobQueue } from './jobQueue.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { NormalizedLead, SearchParams } from '../types/index.js';

/**
 * Job lifecycle (spec): queued → running → completed | failed | retried.
 * Orchestrates: search_request → job → actorManager → leadProcessor → leads.
 */

export interface CreateSearchInput {
  userId: string;
  projectId?: string | null;
  source: string;
  params: SearchParams;
  forceActorId?: string;
}

export async function createSearchJob(
  input: CreateSearchInput,
): Promise<{ jobId: string; searchRequestId: string }> {
  // 1. persist the normalized search request
  const { data: sr, error: srErr } = await supabaseAdmin
    .from('search_requests')
    .insert({
      user_id: input.userId,
      project_id: input.projectId ?? null,
      source: input.source,
      params: input.params,
    })
    .select('id')
    .single();
  if (srErr) throw srErr;

  // 2. create the job in `queued`
  const { data: job, error: jobErr } = await supabaseAdmin
    .from('jobs')
    .insert({
      search_request_id: sr.id,
      project_id: input.projectId ?? null,
      status: 'queued',
    })
    .select('id')
    .single();
  if (jobErr) throw jobErr;

  const run = () => executeJob(job.id, input);
  if (env.syncJobs) {
    await run();
  } else {
    jobQueue.enqueue(run);
  }

  return { jobId: job.id, searchRequestId: sr.id };
}

async function log(
  jobId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  meta: Record<string, unknown> = {},
) {
  await supabaseAdmin
    .from('job_logs')
    .insert({ job_id: jobId, level, message, meta });
}

export async function executeJob(
  jobId: string,
  input: CreateSearchInput,
): Promise<void> {
  const startedAt = new Date().toISOString();
  await supabaseAdmin
    .from('jobs')
    .update({ status: 'running', started_at: startedAt })
    .eq('id', jobId);
  await log(jobId, 'info', `Job started for source "${input.source}"`);

  try {
    const outcome = await runSource(input.source, input.params, {
      forceActorId: input.forceActorId,
    });

    await log(
      jobId,
      'info',
      `Actor "${outcome.actor.name}" returned ${outcome.leads.length} raw leads`,
      { attempts: outcome.attempts, latencyMs: outcome.latencyMs },
    );

    const { leads, duplicatesRemoved } = processLeads(outcome.leads);
    await log(
      jobId,
      'info',
      `Processed leads: ${leads.length} kept, ${duplicatesRemoved} duplicates removed`,
    );

    await persistLeads(jobId, input.projectId ?? null, leads);

    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'completed',
        actor_id: outcome.actor.id,
        external_run_id: outcome.externalRunId ?? null,
        leads_count: leads.length,
        attempts: outcome.attempts,
        finished_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    await log(jobId, 'info', 'Job completed');
  } catch (err) {
    const message = (err as Error).message;
    logger.error(`[jobService] job ${jobId} failed`, message);
    await log(jobId, 'error', `Job failed: ${message}`);
    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'failed',
        error: message,
        finished_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

async function persistLeads(
  jobId: string,
  projectId: string | null,
  leads: NormalizedLead[],
): Promise<void> {
  if (leads.length === 0) return;
  const rows = leads.map((l) => ({
    project_id: projectId,
    job_id: jobId,
    first_name: l.first_name ?? null,
    last_name: l.last_name ?? null,
    title: l.title ?? null,
    company: l.company ?? null,
    email: l.email ?? null,
    phone: l.phone ?? null,
    website: l.website ?? null,
    linkedin: l.linkedin ?? null,
    industry: l.industry ?? null,
    country: l.country ?? null,
    employee_count: l.employee_count ?? null,
    revenue: l.revenue ?? null,
    source: l.source ?? null,
    provider: l.provider ?? null,
    actor: l.actor ?? null,
    confidence_score: l.confidence_score ?? 0.5,
    dedupe_key: l.dedupe_key ?? null,
    raw: l.raw ?? {},
  }));

  // Insert in chunks to stay within payload limits.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabaseAdmin
      .from('leads')
      .insert(rows.slice(i, i + CHUNK));
    if (error) throw error;
  }
}
