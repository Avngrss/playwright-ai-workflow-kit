import { expect, test } from "../../../src/test/fixtures/test";
import {
  expectPricesSorted,
} from "../../../src/test/assertions/ui/product-sorting-ui.assertion";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const EXPECTED_SORT_OPTIONS = [
  { value: "name,asc", label: "Name (A - Z)" },
  { value: "name,desc", label: "Name (Z - A)" },
  { value: "price,desc", label: "Price (High - Low)" },
  { value: "price,asc", label: "Price (Low - High)" },
  { value: "co2_rating,asc", label: "CO₂ Rating (A - E)" },
  { value: "co2_rating,desc", label: "CO₂ Rating (E - A)" },
] as const;

const PRODUCT_SORTING_UI_METADATA = {
  parentSuite: "UI",
  suite: "Products",
  feature: "Product sorting",
  owner: "qa",
} as const;

test.describe("Product sorting UI", { tag: ["@ui", "@sorting", "@catalog"] }, () => {
  test(
    "shows sort control and supported visible sort options",
    { tag: ["@smoke"] },
    async ({ page, productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_SORTING_UI_METADATA,
        story: "Sort dropdown default state",
        severity: "critical",
      });

      await test.step("Open catalog page", async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step("Verify sort control is visible and enabled", async () => {
        await expect(page).toHaveURL(/\/$/);
        await expect(productsPage.sortSelect).toBeVisible();
        await expect(productsPage.sortSelect).toBeEnabled();
      });

      await test.step("Verify visible sort options match supported dropdown options", async () => {
        const options = await productsPage.getSortOptions();
        expect(options).toEqual(EXPECTED_SORT_OPTIONS);
      });
    },
  );

  test(
    "orders visible product cards by Price (Low - High)",
    { tag: ["@smoke"] },
    async ({ page, productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_SORTING_UI_METADATA,
        story: "Sort option: Price (Low - High)",
        severity: "critical",
      });

      await test.step("Open catalog page", async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      await test.step("Apply sort option Price (Low - High)", async () => {
        const productsResponsePromise = page.waitForResponse((response) => {
          if (response.request().method() !== "GET" || !response.url().includes("/products")) {
            return false;
          }

          const responseUrl = new URL(response.url());
          return responseUrl.searchParams.get("sort") === "price,asc";
        });

        await productsPage.selectSort("price,asc");
        await productsResponsePromise;

        await expect(productsPage.sortSelect).toHaveValue("price,asc");
      });

      await test.step("Verify visible product prices are in ascending order", async () => {
        const prices = await productsPage.getVisibleProductPrices();

        expect(prices.length).toBeGreaterThan(1);
        expect(prices.some((price) => Number.isNaN(price))).toBeFalsy();
        expectPricesSorted(prices, "asc");
      });
    },
  );

  test(
    "allows selecting each supported sort option and maps to matching sort request",
    { tag: ["@regression"] },
    async ({ page, productsPage }) => {
      await applyAllureMetadata({
        ...PRODUCT_SORTING_UI_METADATA,
        story: "Sort option mapping coverage",
        severity: "normal",
      });

      await test.step("Open catalog page", async () => {
        await productsPage.open();
        await productsPage.waitForReady();
      });

      for (const sortOption of EXPECTED_SORT_OPTIONS) {
        await test.step(`Select ${sortOption.label} and verify request mapping`, async () => {
          const productsResponsePromise = page.waitForResponse((response) => {
            if (response.request().method() !== "GET" || !response.url().includes("/products")) {
              return false;
            }

            const responseUrl = new URL(response.url());
            return responseUrl.searchParams.get("sort") === sortOption.value;
          });

          await productsPage.selectSort(sortOption.value);
          await productsResponsePromise;

          await expect(productsPage.sortSelect).toHaveValue(sortOption.value);
        });
      }
    },
  );
});
