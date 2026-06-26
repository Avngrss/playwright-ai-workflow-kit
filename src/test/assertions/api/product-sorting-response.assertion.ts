import { expect } from '@playwright/test';
import {
  paginatedProductSortingResponseSchema,
  type PaginatedProductSortingResponse,
  type ProductSortingItem,
} from '../../schemas/api/product-sorting.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

type SortField = 'price' | 'name' | 'co2_rating';
type SortDirection = 'asc' | 'desc';

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeCo2Rating(value: string): string {
  return value.trim().toUpperCase();
}

function isMonotonicAscending<T>(values: T[], compare: (a: T, b: T) => number): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (compare(values[index - 1], values[index]) > 0) {
      return false;
    }
  }

  return true;
}

function isMonotonicDescending<T>(values: T[], compare: (a: T, b: T) => number): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (compare(values[index - 1], values[index]) < 0) {
      return false;
    }
  }

  return true;
}

export function expectPaginatedProductSortingResponse(body: unknown): PaginatedProductSortingResponse {
  return expectToMatchSchema(
    paginatedProductSortingResponseSchema,
    body,
    'Product sorting response schema validation failed.',
  );
}

export function expectProductsSorted(
  products: ProductSortingItem[],
  field: SortField,
  direction: SortDirection,
): void {
  if (field === 'price') {
    const prices = products.map((product) => product.price);
    const comparator = (left: number, right: number): number => left - right;

    if (direction === 'asc') {
      expect(isMonotonicAscending(prices, comparator)).toBeTruthy();
      return;
    }

    expect(isMonotonicDescending(prices, comparator)).toBeTruthy();
    return;
  }

  const names = products.map((product) => normalizeName(product.name));
  const comparator = (left: string, right: string): number => left.localeCompare(right);

  if (field === 'co2_rating') {
    // ProductResponse models co2_rating as optional. This invariant is valid only for
    // comparable datasets where each returned item has a non-empty co2_rating.
    const ratings = products.map((product) => {
      expect(
        typeof product.co2_rating === 'string',
        'Cannot assert co2_rating sorting: encountered item without co2_rating value.',
      ).toBeTruthy();
      expect(
        product.co2_rating,
        'Cannot assert co2_rating sorting: encountered empty co2_rating value.',
      ).not.toHaveLength(0);

      return normalizeCo2Rating(product.co2_rating as string);
    });

    if (direction === 'asc') {
      expect(isMonotonicAscending(ratings, comparator)).toBeTruthy();
      return;
    }

    expect(isMonotonicDescending(ratings, comparator)).toBeTruthy();
    return;
  }

  if (direction === 'asc') {
    expect(isMonotonicAscending(names, comparator)).toBeTruthy();
    return;
  }

  expect(isMonotonicDescending(names, comparator)).toBeTruthy();
}
