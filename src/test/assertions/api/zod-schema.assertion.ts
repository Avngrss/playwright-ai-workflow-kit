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

  expect(
    result.success,
    result.success
      ? message
      : `${message}\n${formatIssues(result.error.issues)}`,
  ).toBeTruthy();

  if (!result.success) {
    throw new Error(message);
  }

  return result.data;
}
