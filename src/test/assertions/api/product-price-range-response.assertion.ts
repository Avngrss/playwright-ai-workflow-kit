import { expect } from '@playwright/test';
import {
  paginatedProductSortingResponseSchema,
  type PaginatedProductSortingResponse,
  type ProductSortingItem,
} from '../../schemas/api/product-sorting.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

export function expectPaginatedProductPriceRangeResponse(
  body: unknown,
): PaginatedProductSortingResponse {
  return expectToMatchSchema(
    paginatedProductSortingResponseSchema,
    body,
    'Product price-range response schema validation failed.',
  );
}

export function expectProductsWithinPriceRange(
  products: ProductSortingItem[],
  minPrice: number,
  maxPrice: number,
): void {
  if (minPrice > maxPrice) {
    throw new Error(`Invalid price range assertion: ${minPrice} cannot exceed ${maxPrice}.`);
  }

  expect(products.length).toBeGreaterThan(0);

  const prices = products.map((product) => product.price);
  const outOfRangePrices = prices.filter((price) => price < minPrice || price > maxPrice);

  expect(outOfRangePrices).toEqual([]);
}
