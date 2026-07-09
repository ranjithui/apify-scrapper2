import { supabaseAdmin } from '../config/supabase.js';

/** Tables that carry a project_id column and can be scoped to a project. */
const PROJECT_SCOPED = new Set(['leads', 'jobs']);

/** Aggregated metrics for the dashboard endpoint. */
export async function getDashboard(projectId?: string) {
  const count = async (table: string) => {
    let q = supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (projectId && PROJECT_SCOPED.has(table)) {
      q = q.eq('project_id', projectId) as typeof q;
    }
    const { count: c } = await q;
    return c ?? 0;
  };

  const [totalLeads, totalJobs, totalProjects, totalActors] = await Promise.all(
    [count('leads'), count('jobs'), count('projects'), count('actors')],
  );

  // jobs by status
  const { data: jobsRaw } = await supabaseAdmin
    .from('jobs')
    .select('status');
  const jobsByStatus = (jobsRaw ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      const s = (r as { status: string }).status;
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {},
  );

  // leads by source
  const { data: leadsRaw } = await supabaseAdmin
    .from('leads')
    .select('source')
    .limit(10000);
  const leadsBySource = (leadsRaw ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      const s = (r as { source: string | null }).source ?? 'unknown';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {},
  );

  // recent jobs
  let recentQ = supabaseAdmin
    .from('jobs')
    .select('id, status, leads_count, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  if (projectId) recentQ = recentQ.eq('project_id', projectId) as typeof recentQ;
  const { data: recentJobs } = await recentQ;

  return {
    totals: {
      leads: totalLeads,
      jobs: totalJobs,
      projects: totalProjects,
      actors: totalActors,
    },
    jobsByStatus,
    leadsBySource,
    recentJobs: recentJobs ?? [],
  };
}
