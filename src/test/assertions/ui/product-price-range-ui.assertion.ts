import { expect } from '@playwright/test';

export function expectPricesWithinRange(prices: number[], min: number, max: number): void {
  expect(prices.length).toBeGreaterThan(0);
  expect(prices.some((price) => Number.isNaN(price))).toBeFalsy();

  const outOfRangePrices = prices.filter((price) => price < min || price > max);
  expect(outOfRangePrices).toEqual([]);
}
