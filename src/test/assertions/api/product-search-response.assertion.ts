import { expect } from '@playwright/test';
import {
  paginatedProductSortingResponseSchema,
  type PaginatedProductSortingResponse,
  type ProductSortingItem,
} from '../../schemas/api/product-sorting.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function expectPaginatedProductSearchResponse(
  body: unknown,
): PaginatedProductSortingResponse {
  return expectToMatchSchema(
    paginatedProductSortingResponseSchema,
    body,
    'Product search response schema validation failed.',
  );
}

export function expectProductsMatchSearchQuery(
  products: ProductSortingItem[],
  query: string,
): void {
  expect(products.length).toBeGreaterThan(0);

  const normalizedQuery = normalize(query);
  const nonMatching = products.filter(
    (product) => !normalize(product.name).includes(normalizedQuery),
  );

  expect(nonMatching).toEqual([]);
}
