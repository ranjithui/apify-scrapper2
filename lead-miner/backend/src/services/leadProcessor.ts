import type { NormalizedLead } from '../types/index.js';

/**
 * Lead Processor.
 *
 * - Remove duplicates (within-batch, by dedupe key)
 * - Normalize company names
 * - Clean emails
 * - Clean phone numbers
 * - Standardize countries
 * (AI enrichment = Phase 3)
 */
export interface ProcessResult {
  leads: NormalizedLead[];
  duplicatesRemoved: number;
}

export function processLeads(raw: NormalizedLead[]): ProcessResult {
  const seen = new Map<string, NormalizedLead>();
  let duplicatesRemoved = 0;

  for (const lead of raw) {
    const cleaned = cleanLead(lead);
    const key = dedupeKey(cleaned);
    cleaned.dedupe_key = key;

    if (key && seen.has(key)) {
      duplicatesRemoved++;
      // Keep the more complete record (higher confidence).
      const existing = seen.get(key)!;
      if ((cleaned.confidence_score ?? 0) > (existing.confidence_score ?? 0)) {
        seen.set(key, cleaned);
      }
      continue;
    }
    if (key) seen.set(key, cleaned);
    else seen.set(`__nokey_${seen.size}`, cleaned);
  }

  return { leads: [...seen.values()], duplicatesRemoved };
}

export function cleanLead(lead: NormalizedLead): NormalizedLead {
  return {
    ...lead,
    first_name: titleCase(trim(lead.first_name)),
    last_name: titleCase(trim(lead.last_name)),
    company: normalizeCompany(lead.company),
    email: cleanEmail(lead.email),
    phone: cleanPhone(lead.phone),
    website: cleanUrl(lead.website),
    linkedin: cleanUrl(lead.linkedin),
    country: standardizeCountry(lead.country),
  };
}

// ── helpers ────────────────────────────────────────────────────────────
const trim = (s?: string | null) => (s ?? '').toString().trim() || null;

function titleCase(s: string | null): string | null {
  if (!s) return null;
  return s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

export function normalizeCompany(name?: string | null): string | null {
  const s = trim(name);
  if (!s) return null;
  // strip common legal suffixes and extra whitespace
  return s
    .replace(/[,.]/g, ' ')
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|gmbh|co|company|plc|pvt)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanEmail(email?: string | null): string | null {
  const s = trim(email);
  if (!s) return null;
  const lower = s.toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower);
  return valid ? lower : null;
}

export function cleanPhone(phone?: string | null): string | null {
  const s = trim(phone);
  if (!s) return null;
  // keep leading + and digits
  const cleaned = s.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 7 ? cleaned : null;
}

function cleanUrl(url?: string | null): string | null {
  const s = trim(url);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s) || /\.[a-z]{2,}$/i.test(s)) return `https://${s}`;
  return s;
}

const COUNTRY_ALIASES: Record<string, string> = {
  us: 'United States',
  usa: 'United States',
  'u.s.': 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom',
  gb: 'United Kingdom',
  uae: 'United Arab Emirates',
};

export function standardizeCountry(country?: string | null): string | null {
  const s = trim(country);
  if (!s) return null;
  const alias = COUNTRY_ALIASES[s.toLowerCase()];
  if (alias) return alias;
  return titleCase(s);
}

/** Dedupe key: prefer email; else company+website; else company+phone. */
export function dedupeKey(lead: NormalizedLead): string | null {
  if (lead.email) return `email:${lead.email}`;
  const company = (normalizeCompany(lead.company) ?? '').toLowerCase();
  if (company && lead.website) {
    return `cw:${company}|${(lead.website ?? '').toLowerCase()}`;
  }
  if (company && lead.phone) return `cp:${company}|${lead.phone}`;
  if (company) return `c:${company}`;
  return null;
}
