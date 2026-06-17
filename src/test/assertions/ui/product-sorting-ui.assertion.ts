import { expect } from "@playwright/test";

type SortDirection = "asc" | "desc";

function isMonotonicAscending<T>(values: T[], compare: (left: T, right: T) => number): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (compare(values[index - 1], values[index]) > 0) {
      return false;
    }
  }

  return true;
}

function isMonotonicDescending<T>(values: T[], compare: (left: T, right: T) => number): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (compare(values[index - 1], values[index]) < 0) {
      return false;
    }
  }

  return true;
}

export function expectPricesSorted(prices: number[], direction: SortDirection): void {
  const comparator = (left: number, right: number): number => left - right;

  if (direction === "asc") {
    expect(isMonotonicAscending(prices, comparator)).toBeTruthy();
    return;
  }

  expect(isMonotonicDescending(prices, comparator)).toBeTruthy();
}
