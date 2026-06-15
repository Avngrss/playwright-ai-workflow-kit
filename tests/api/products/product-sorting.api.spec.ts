import { expect, test } from '@playwright/test';
import {
  expectPaginatedProductSortingResponse,
  expectProductsSorted,
} from '../../../src/test/assertions/api/product-sorting-response.assertion';

const PRODUCTS_ENDPOINT = '/products';

const CONFIRMED_SORT_CASES = [
  { sort: 'name,asc', field: 'name', direction: 'asc', tag: '@smoke' },
  { sort: 'name,desc', field: 'name', direction: 'desc', tag: '@regression' },
  { sort: 'price,asc', field: 'price', direction: 'asc', tag: '@smoke' },
  { sort: 'price,desc', field: 'price', direction: 'desc', tag: '@regression' },
  { sort: 'co2_rating,asc', field: 'co2_rating', direction: 'asc', tag: '@regression' },
  { sort: 'co2_rating,desc', field: 'co2_rating', direction: 'desc', tag: '@regression' },
] as const;

test.describe('Products API | GET /products sort options', { tag: ['@sorting', '@catalog'] }, () => {
  for (const sortCase of CONFIRMED_SORT_CASES) {
    test(
      `returns products sorted by ${sortCase.sort}`,
      { tag: ['@api', sortCase.tag] },
      async ({ request }) => {
        const response = await request.get(PRODUCTS_ENDPOINT, {
          params: { sort: sortCase.sort },
        });
        const body = await response.json();

        expect(response.status()).toBe(200);
        expectPaginatedProductSortingResponse(body);

        test.skip(
          body.data.length < 2,
          `Insufficient comparable data for sorting invariant: ${sortCase.sort}`,
        );

        expectProductsSorted(body.data, sortCase.field, sortCase.direction);
      },
    );
  }
});
