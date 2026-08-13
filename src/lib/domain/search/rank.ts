import { normalizeCourseCode, normalizeHumanQuery } from '$lib/domain/academic/formatters';
import type { SearchCandidate } from './types';

function normalize(value: string) {
  return normalizeHumanQuery(value).toLocaleLowerCase('en');
}

function compact(value: string) {
  return normalize(value).replace(/[\s-]+/g, '');
}

export function scoreSearchCandidate(query: string, candidate: SearchCandidate) {
  const q = normalize(query);
  if (!q) return 0;
  const qCompact = compact(query);

  if (candidate.canonicalCode && normalizeCourseCode(candidate.canonicalCode) === normalizeCourseCode(query)) {
    return 100;
  }

  const values = [candidate.title, ...(candidate.aliases ?? [])].filter(Boolean);
  const normalized = values.map(normalize);
  const compacted = values.map(compact);

  if (normalized.includes(q)) return 98;
  if (compacted.includes(qCompact)) return 96;
  if (normalized.some((value) => value.startsWith(q))) return 86;
  if (compacted.some((value) => value.startsWith(qCompact))) return 84;

  const queryTokens = q.split(/\s+/).filter(Boolean);
  if (
    queryTokens.length > 0 &&
    normalized.some((value) => queryTokens.every((token) => value.split(/\s+/).some((part) => part.startsWith(token))))
  ) {
    return 78;
  }

  if (normalized.some((value) => value.includes(q))) return 72;

  const keywordHaystack = (candidate.keywords ?? []).map(normalize).join(' ');
  if (keywordHaystack && queryTokens.every((token) => keywordHaystack.includes(token))) return 64;
  return 0;
}
