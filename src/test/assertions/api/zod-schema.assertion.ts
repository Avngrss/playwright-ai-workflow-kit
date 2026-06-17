import { expect } from '@playwright/test';
import type { ZodError, ZodTypeAny } from 'zod';

function formatZodIssues(error: ZodError): string {
  return error.issues
    .map((issue, index) => {
      const fieldPath = issue.path.length > 0 ? issue.path.join('.') : '<root>';
      return `${index + 1}) ${fieldPath}: ${issue.message}`;
    })
    .join('\n');
}

export function expectToMatchSchema<TSchema extends ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  failureContext = 'Schema validation failed.',
): TSchema['_output'] {
  const result = schema.safeParse(value);

  const failureMessage = result.success
    ? undefined
    : `${failureContext}\n${formatZodIssues(result.error)}`;

  expect(result.success, failureMessage).toBeTruthy();

  if (!result.success) {
    throw new Error(failureContext);
  }

  return result.data;
}
