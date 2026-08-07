import { randomUUID } from "node:crypto";

export function createUniqueEmail(prefix: string): string {
  const uniquePart = `${Date.now()}-${randomUUID().slice(0, 8)}`;

  return `${prefix}-${uniquePart}@example.test`;
}
