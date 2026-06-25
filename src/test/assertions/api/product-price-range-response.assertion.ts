import { expect } from '@playwright/test';
import { z } from 'zod';
import {
  paginatedProductSortingResponseSchema,
  type PaginatedProductSortingResponse,
  type ProductSortingItem,
} from '../../schemas/api/product-sorting.schema';
import { expectToMatchSchema } from './zod-schema.assertion';

const paginatedProductPriceRangeResponseSchema = paginatedProductSortingResponseSchema
  .omit({ from: true, to: true })
  .extend({
    from: z.number().int().nullish(),
    to: z.number().int().nullish(),
  });

export function expectPaginatedProductPriceRangeResponse(
  body: unknown,
): PaginatedProductSortingResponse {
  return expectToMatchSchema(
    paginatedProductPriceRangeResponseSchema,
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

export function expectEmptyProductList(products: ProductSortingItem[]): void {
  expect(products).toEqual([]);
}
