import type { Actor, NormalizedLead, Provider } from '../types/index.js';

/**
 * Output Mapper.
 *
 * Maps a raw item from any actor into the standard NormalizedLead schema
 * using the actor's `output_mapping`: { normalizedField: "sourcePath" }.
 *
 * Source paths support dot/array access ("emails.0", "organization.name").
 * The special mapping value "@" copies the entire raw item (used for `raw`).
 */
const LEAD_FIELDS: (keyof NormalizedLead)[] = [
  'first_name',
  'last_name',
  'title',
  'company',
  'email',
  'phone',
  'website',
  'linkedin',
  'industry',
  'country',
  'employee_count',
  'revenue',
];

export function mapOutput(
  actor: Actor,
  item: Record<string, unknown>,
  providerKey: string,
): NormalizedLead {
  const mapping = actor.output_mapping ?? {};
  const lead: NormalizedLead = {
    source: actor.source,
    provider: providerKey,
    actor: actor.name,
    raw: item,
  };

  for (const field of LEAD_FIELDS) {
    const path = mapping[field];
    if (!path) continue;
    const value = path === '@' ? item : getPath(item, path);
    if (value !== undefined && value !== null && value !== '') {
      (lead as Record<string, unknown>)[field] = coerce(value);
    }
  }

  lead.confidence_score = scoreConfidence(lead);
  return lead;
}

function coerce(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).map(String).join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Dot/array path accessor: "emails.0", "a.b.c" */
function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    if (Array.isArray(acc)) return acc[Number(key)];
    if (typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/**
 * Simple heuristic confidence score in [0,1] based on how complete the lead
 * is. Phase 3 replaces this with AI enrichment scoring.
 */
function scoreConfidence(lead: NormalizedLead): number {
  const weights: Partial<Record<keyof NormalizedLead, number>> = {
    email: 0.3,
    company: 0.2,
    phone: 0.15,
    linkedin: 0.1,
    website: 0.1,
    first_name: 0.05,
    last_name: 0.05,
    title: 0.05,
  };
  let score = 0;
  for (const [field, w] of Object.entries(weights)) {
    if (lead[field as keyof NormalizedLead]) score += w as number;
  }
  return Math.round(Math.min(1, score) * 1000) / 1000;
}
