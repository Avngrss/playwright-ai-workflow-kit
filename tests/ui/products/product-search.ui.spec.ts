import type { Page } from '@playwright/test';
import { expect, test } from "../../../src/test/fixtures/test";
import { expectVisibleNamesMatchQuery } from "../../../src/test/assertions/ui/product-search-ui.assertion";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const PRODUCT_SEARCH_UI_METADATA = {
  parentSuite: "UI",
  suite: "Products",
  feature: "Product search",
  owner: "qa",
} as const;

function waitForProductsSearchResponse(page: Page, query: string) {
  return page.waitForResponse((response) => {
    if (response.request().method() !== "GET") {
      return false;
    }
    const url = response.url();
    if (!url.includes("/products/search")) {
      return false;
    }
    try {
      const responseUrl = new URL(url);
      return responseUrl.searchParams.get("q") === query;
    } catch {
      return false;
    }
  });
}

test.describe("Product search UI", { tag: ["@ui", "@search", "@catalog"] }, () => {
  test(
    "shows search control inside filters and it is enabled",
    { tag: ["@smoke"] },
    async ({ productsPage, page }) => {
      await applyAllureMetadata({
        ...PRODUCT_SEARCH_UI_METADATA,
        story: "Search control default state",
        severity: "critical",
      });

      await test.step("Open catalog page", async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step("Verify search input is visible and enabled inside filters", async () => {
        await expect(page).toHaveURL(/\/$/);
        await expect(productsPage.filtersPanel).toBeVisible();
        await expect(productsPage.searchInput).toBeVisible();
        await expect(productsPage.searchInput).toBeEnabled();
      });
    },
  );

  test(
    "filters visible product names to those matching the search query",
    { tag: ["@smoke"] },
    async ({ page, productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_SEARCH_UI_METADATA,
        story: "Search filters results by name",
        severity: "critical",
      });

      await test.step("Open catalog page", async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step("Perform search for a term that matches products", async () => {
        const searchResponsePromise = waitForProductsSearchResponse(page, "hammer");

        await productsPage.searchFor("hammer");
        await searchResponsePromise;
      });

      await test.step("Verify visible product names all contain the search term", async () => {
        const names = await productsPage.getVisibleProductNames();

        expect(names.length).toBeGreaterThan(0);
        expectVisibleNamesMatchQuery(names, "hammer");
      });
    },
  );

  test(
    "shows empty results state for a non-matching search query",
    { tag: ["@regression"] },
    async ({ page, productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_SEARCH_UI_METADATA,
        story: "Search no-match empty state",
        severity: "normal",
      });

      await test.step("Open catalog page", async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step("Perform search for a term that matches no products", async () => {
        const searchResponsePromise = waitForProductsSearchResponse(
          page,
          "zzzznonexistentsearchterm98765",
        );

        await productsPage.searchFor("zzzznonexistentsearchterm98765");
        await searchResponsePromise;
      });

      await test.step("Verify no products are visible", async () => {
        const names = await productsPage.getVisibleProductNames();
        expect(names).toEqual([]);
      });
    },
  );
});
