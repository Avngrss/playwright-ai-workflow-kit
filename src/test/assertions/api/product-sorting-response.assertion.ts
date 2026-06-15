import { expect } from '@playwright/test';

type SortField = 'price' | 'name' | 'co2_rating';
type SortDirection = 'asc' | 'desc';

type ProductSortingItem = {
  name: string;
  price: number;
  co2_rating?: string;
};

type PaginatedProductResponse = {
  current_page?: number;
  data: ProductSortingItem[];
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
  last_page?: number;
};

function expectIntegerIfDefined(value: unknown): void {
  if (value !== undefined) {
    expect(typeof value).toBe('number');
    expect(Number.isInteger(value)).toBeTruthy();
  }
}

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

export function expectPaginatedProductSortingResponse(body: unknown): asserts body is PaginatedProductResponse {
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();

  const response = body as Record<string, unknown>;

  expect(Array.isArray(response.data)).toBeTruthy();
  expectIntegerIfDefined(response.current_page);
  expectIntegerIfDefined(response.per_page);
  expectIntegerIfDefined(response.total);
  expectIntegerIfDefined(response.from);
  expectIntegerIfDefined(response.to);
  expectIntegerIfDefined(response.last_page);

  for (const item of response.data as unknown[]) {
    expect(typeof item).toBe('object');
    expect(item).not.toBeNull();

    const product = item as Record<string, unknown>;

    expect(typeof product.name).toBe('string');
    expect(typeof product.price).toBe('number');
    expect(Number.isFinite(product.price)).toBeTruthy();
  }
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
    const ratings = products.map((product) => {
      expect(typeof product.co2_rating).toBe('string');
      expect(product.co2_rating).not.toHaveLength(0);

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
