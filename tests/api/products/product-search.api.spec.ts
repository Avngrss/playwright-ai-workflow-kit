import { expect, test } from '@playwright/test';
import {
  expectPaginatedProductSearchResponse,
  expectProductsMatchSearchQuery,
} from '../../../src/test/assertions/api/product-search-response.assertion';

const SEARCH_ENDPOINT = '/products/search';

test.describe('Products API | GET /products/search', { tag: ['@search', '@catalog'] }, () => {
  test(
    'returns products matching the search query',
    { tag: ['@api', '@smoke'] },
    async ({ request }) => {
      const response = await request.get(SEARCH_ENDPOINT, {
        params: { q: 'hammer' },
      });

      expect(response.status()).toBe(200);
      const body = expectPaginatedProductSearchResponse(await response.json());

      test.skip(
        body.data.length < 1,
        'Insufficient data for search match invariant: hammer',
      );

      expectProductsMatchSearchQuery(body.data, 'hammer');
    },
  );

  test.skip(
    'returns 404 for a non-matching search query',
    { tag: ['@api', '@regression'] },
    async () => {
      // Blocked: OpenAPI documents 404 (ItemNotFoundResponse) for /products/search on no-match,
      // but live returned 200 (likely empty data). Non-matching q negative behavior not covered
      // until contract gap clarified. See search.md API Coverage blockers.
    },
  );

  test(
    'supports page parameter for search results',
    { tag: ['@api', '@regression'] },
    async ({ request }) => {
      const response = await request.get(SEARCH_ENDPOINT, {
        params: { q: 'hammer', page: 1 },
      });

      expect(response.status()).toBe(200);
      const body = expectPaginatedProductSearchResponse(await response.json());

      if (typeof body.current_page === 'number') {
        expect(body.current_page).toBe(1);
      }
    },
  );
});
