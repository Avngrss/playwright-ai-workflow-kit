import type { Page, Response } from '@playwright/test';
import { expect, test } from '../../../src/test/fixtures/test';
import { expectPricesWithinRange } from '../../../src/test/assertions/ui/product-price-range-ui.assertion';
import { applyAllureMetadata } from '../../../src/test/reporting/allure-metadata.helper';

const PRODUCT_PRICE_RANGE_UI_METADATA = {
  parentSuite: 'UI',
  suite: 'Products',
  feature: 'Product price range',
  owner: 'qa',
} as const;

const TARGET_PRICE_RANGE = {
  min: 20,
  max: 80,
  betweenQueryValue: 'price,20,80',
} as const;

function waitForProductsBetweenResponse(page: Page, betweenQueryValue: string): Promise<Response> {
  return page.waitForResponse((response) => {
    if (response.request().method() !== 'GET' || !response.url().includes('/products')) {
      return false;
    }

    const responseUrl = new URL(response.url());
    return responseUrl.searchParams.get('between') === betweenQueryValue;
  });
}

test.describe('Product price range UI', { tag: ['@ui', '@filtering', '@catalog'] }, () => {
  test(
    'shows price range slider controls and allows direct handle interaction',
    { tag: ['@smoke'] },
    async ({ productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_PRICE_RANGE_UI_METADATA,
        story: 'Price range slider default state',
        severity: 'critical',
      });

      await test.step('Open catalog page', async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step('Verify slider controls are visible', async () => {
        await expect(productsPage.filtersPanel).toBeVisible();
        await expect(productsPage.priceRangeHeading).toBeVisible();
        await expect(productsPage.priceRangeMinHandle).toBeVisible();
        await expect(productsPage.priceRangeMaxHandle).toBeVisible();
      });

      await test.step('Verify slider handles are focusable and have valid initial values', async () => {
        await productsPage.priceRangeMinHandle.click();
        await expect(productsPage.priceRangeMinHandle).toBeFocused();

        await productsPage.priceRangeMaxHandle.click();
        await expect(productsPage.priceRangeMaxHandle).toBeFocused();

        const values = await productsPage.getPriceRangeValues();
        expect(values.min).toBeLessThanOrEqual(values.max);
      });
    },
  );

  test(
    'filters visible products to selected price range',
    { tag: ['@smoke'] },
    async ({ page, productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_PRICE_RANGE_UI_METADATA,
        story: 'Apply representative price range',
        severity: 'critical',
      });

      await test.step('Open catalog page', async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step('Set slider to target range', async () => {
        const productsResponsePromise = waitForProductsBetweenResponse(
          page,
          TARGET_PRICE_RANGE.betweenQueryValue,
        );

        await productsPage.setPriceRange(TARGET_PRICE_RANGE.min, TARGET_PRICE_RANGE.max);
        const productsResponse = await productsResponsePromise;
        expect(productsResponse.ok()).toBeTruthy();

        const values = await productsPage.getPriceRangeValues();
        expect(values).toEqual({
          min: TARGET_PRICE_RANGE.min,
          max: TARGET_PRICE_RANGE.max,
        });
      });

      await test.step('Verify visible product prices are inside selected range', async () => {
        const prices = await productsPage.getVisibleProductPrices();
        expectPricesWithinRange(prices, TARGET_PRICE_RANGE.min, TARGET_PRICE_RANGE.max);
      });
    },
  );

  test(
    'maps selected slider range to between query parameter',
    { tag: ['@regression'] },
    async ({ page, productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_PRICE_RANGE_UI_METADATA,
        story: 'Slider to products query mapping',
        severity: 'normal',
      });

      await test.step('Open catalog page', async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step('Apply range and capture matching products response', async () => {
        const productsResponsePromise = waitForProductsBetweenResponse(
          page,
          TARGET_PRICE_RANGE.betweenQueryValue,
        );

        await productsPage.setPriceRange(TARGET_PRICE_RANGE.min, TARGET_PRICE_RANGE.max);
        const productsResponse = await productsResponsePromise;
        expect(productsResponse.ok()).toBeTruthy();

        const responseUrl = new URL(productsResponse.url());
        expect(responseUrl.searchParams.get('between')).toBe(TARGET_PRICE_RANGE.betweenQueryValue);
      });
    },
  );
});
