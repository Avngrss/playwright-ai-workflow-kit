import { expect } from "@playwright/test";
import type { ZodType } from "zod";

function formatIssues(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function expectToMatchSchema<T>(
  schema: ZodType<T>,
  value: unknown,
  message: string,
): T {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  const failureMessage = `${message}\n${formatIssues(result.error.issues)}`;

  expect(result.success, failureMessage).toBe(true);

  throw new Error(failureMessage);
}
