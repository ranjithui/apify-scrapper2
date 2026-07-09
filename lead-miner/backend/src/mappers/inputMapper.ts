import type { Actor, SearchParams } from '../types/index.js';

/**
 * Input Mapper.
 *
 * Converts a generic SearchParams request into the JSON body required by a
 * specific actor, using that actor's `input_schema` template.
 *
 * The template is a JSON object whose string values may contain
 * `{{placeholders}}` referencing SearchParams keys, e.g.:
 *   { "searchStringsArray": "{{keyword}}", "locationQuery": "{{city}} {{country}}" }
 *
 * - A value that is exactly one placeholder (`"{{limit}}"`) is replaced with
 *   the raw typed value (number stays a number).
 * - A value with embedded text (`"{{city}} {{country}}"`) is string-interpolated.
 * - Unresolved placeholders are dropped so we never send literal "{{x}}".
 * - The actor's `default_input` is used as the base and overridden by mapped
 *   values.
 */
export function mapInput(
  actor: Actor,
  params: SearchParams,
): Record<string, unknown> {
  const template = actor.input_schema ?? {};
  const mapped: Record<string, unknown> = {};

  for (const [key, tpl] of Object.entries(template)) {
    if (typeof tpl !== 'string') {
      mapped[key] = tpl;
      continue;
    }
    const resolved = resolve(tpl, params);
    if (resolved !== undefined && resolved !== '') {
      mapped[key] = resolved;
    }
  }

  return { ...actor.default_input, ...mapped };
}

const EXACT = /^\{\{\s*([\w.]+)\s*\}\}$/;
const TOKEN = /\{\{\s*([\w.]+)\s*\}\}/g;

function resolve(tpl: string, params: SearchParams): unknown {
  // Exact single-placeholder → keep the raw typed value.
  const exact = tpl.match(EXACT);
  if (exact) {
    return get(params, exact[1]);
  }

  // Interpolated string → substitute and trim.
  let hadAny = false;
  const out = tpl.replace(TOKEN, (_m, name: string) => {
    const v = get(params, name);
    if (v === undefined || v === null) return '';
    hadAny = true;
    return String(v);
  });
  const trimmed = out.trim().replace(/\s+/g, ' ');
  return hadAny ? trimmed : trimmed || undefined;
}

function get(params: SearchParams, path: string): unknown {
  return (params as Record<string, unknown>)[path];
}
