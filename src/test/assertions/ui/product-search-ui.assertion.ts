import { expect } from '@playwright/test';

export function expectVisibleNamesMatchQuery(names: string[], query: string): void {
  expect(names.length).toBeGreaterThan(0);

  const normalizedQuery = query.trim().toLowerCase();
  const nonMatching = names.filter((name) => !name.toLowerCase().includes(normalizedQuery));

  expect(nonMatching).toEqual([]);
}
