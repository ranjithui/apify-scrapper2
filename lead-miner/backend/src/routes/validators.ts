import { z } from 'zod';

export const searchParamsSchema = z.object({
  keyword: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  employee_count: z.string().optional(),
  revenue: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  company_name: z.string().optional(),
  website: z.string().optional(),
  linkedin_url: z.string().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const createSearchSchema = z.object({
  project_id: z.string().uuid().nullish(),
  source: z.string().min(1),
  params: searchParamsSchema.default({}),
  actor_id: z.string().uuid().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  owner_id: z.string().uuid().optional(),
});

export const actorSchema = z.object({
  provider_id: z.string().uuid(),
  source: z.string().min(1),
  name: z.string().min(1),
  actor_ref: z.string().min(1),
  priority: z.number().int().positive().optional(),
  status: z.enum(['active', 'standby', 'disabled']).optional(),
  input_schema: z.record(z.unknown()).optional(),
  output_mapping: z.record(z.string()).optional(),
  default_input: z.record(z.unknown()).optional(),
});

export const actorUpdateSchema = actorSchema.partial();

export const actorTestSchema = z.object({
  actor_id: z.string().uuid(),
  params: searchParamsSchema.default({}),
});

export const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'json', 'google_sheets', 'crm']),
  project_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  source: z.string().optional(),
  min_confidence: z.number().min(0).max(1).optional(),
});
