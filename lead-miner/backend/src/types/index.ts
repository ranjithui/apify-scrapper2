// =====================================================================
// Shared domain types
// =====================================================================

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';
export type ActorStatus = 'active' | 'standby' | 'disabled';
export type JobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retried';
export type ExportFormat = 'csv' | 'excel' | 'json' | 'google_sheets' | 'crm';

/** The generic, provider-independent search request. */
export interface SearchParams {
  keyword?: string;
  industry?: string;
  country?: string;
  city?: string;
  employee_count?: string;
  revenue?: string;
  technologies?: string[];
  company_name?: string;
  website?: string;
  linkedin_url?: string;
  limit?: number;
}

/** The normalized lead schema (spec: "Normalized Lead"). */
export interface NormalizedLead {
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  linkedin?: string | null;
  industry?: string | null;
  country?: string | null;
  employee_count?: string | null;
  revenue?: string | null;
  source?: string | null;
  provider?: string | null;
  actor?: string | null;
  confidence_score?: number;
  dedupe_key?: string | null;
  raw?: Record<string, unknown>;
}

export interface Actor {
  id: string;
  provider_id: string;
  source: string;
  name: string;
  actor_ref: string;
  priority: number;
  status: ActorStatus;
  input_schema: Record<string, unknown>;
  output_mapping: Record<string, string>;
  default_input: Record<string, unknown>;
}

export interface Provider {
  id: string;
  key: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

/** Result returned by a provider run before normalization. */
export interface ProviderRunResult {
  items: Array<Record<string, unknown>>;
  externalRunId?: string;
  latencyMs: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  accessToken: string;
}
