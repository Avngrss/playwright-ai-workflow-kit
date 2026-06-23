import { expect, test } from '@playwright/test';
import {
  expectPaginatedProductPriceRangeResponse,
  expectProductsWithinPriceRange,
} from '../../../src/test/assertions/api/product-price-range-response.assertion';

const PRODUCTS_ENDPOINT = '/products';

const PRICE_RANGE_CASES = [
  { between: 'price,10,100', minPrice: 10, maxPrice: 100, scopeTag: '@smoke' },
  { between: 'price,20,80', minPrice: 20, maxPrice: 80, scopeTag: '@regression' },
] as const;

test.describe('Products API | GET /products price range', { tag: ['@filtering', '@catalog'] }, () => {
  for (const rangeCase of PRICE_RANGE_CASES) {
    test(
      `returns products within ${rangeCase.between}`,
      { tag: ['@api', rangeCase.scopeTag] },
      async ({ request }) => {
        const response = await request.get(PRODUCTS_ENDPOINT, {
          params: { between: rangeCase.between },
        });

        expect(response.status()).toBe(200);
        const body = expectPaginatedProductPriceRangeResponse(await response.json());

        test.skip(
          body.data.length < 1,
          `Insufficient comparable data for price range invariant: ${rangeCase.between}`,
        );

        expectProductsWithinPriceRange(body.data, rangeCase.minPrice, rangeCase.maxPrice);
      },
    );
  }
});
