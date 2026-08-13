type ErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

const BUSINESS_MESSAGES: Array<[RegExp, string]> = [
  [/warnings?.+acknowledg/i, 'Acknowledge the import warnings before applying this batch.'],
  [/preview.+(changed|hash)/i, 'This import changed after the preview was created. Re-open and review it before applying.'],
  [/validation errors?/i, 'Resolve all validation errors before applying this import.'],
  [/batch.+ready/i, 'This import is not ready to be applied yet.'],
  [/already.+applied|terminal import batch/i, 'This import has already reached a final state and cannot be changed.'],
  [/current academic term/i, 'This action is only available for the current academic term.'],
  [/must be verified before publication/i, 'Verify the related academic data before publishing it.'],
  [/referenced rooms?.+verified/i, 'Verify and publish every referenced room before publishing this schedule.']
];

/**
 * Convert database/RPC failures into user-facing administration copy without
 * returning schema names, SQL details, constraint names, or implementation hints
 * to the browser. The complete error remains server-side for diagnosis.
 */
export function safeAdminActionError(
  error: ErrorLike | Error | null | undefined,
  fallback: string,
  context: string
) {
  const candidate = error as ErrorLike | undefined;
  const code = candidate?.code ?? null;
  const message = candidate?.message ?? (error instanceof Error ? error.message : null);

  console.error(`[admin-action:${context}]`, {
    code,
    message,
    details: candidate?.details ?? null,
    hint: candidate?.hint ?? null
  });

  if (code === '42501') return 'You are not authorized to perform that action.';
  if (code === '23505') return 'That change conflicts with an existing record.';
  if (code === '23514') return 'That change does not satisfy the current data rules.';
  if (code === 'P0002') return 'The requested record no longer exists.';

  if (message) {
    for (const [pattern, safe] of BUSINESS_MESSAGES) {
      if (pattern.test(message)) return safe;
    }
  }

  return fallback;
}
