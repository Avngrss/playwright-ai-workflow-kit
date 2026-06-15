import { expect, test } from "../../../src/test/fixtures/test";
import {
  expectCo2RatingsSorted,
  expectNamesSorted,
  expectPricesSorted,
  getCo2SortComparabilityIssue,
  getNameSortComparabilityIssue,
  getPriceSortComparabilityIssue,
} from "../../../src/test/assertions/ui/product-sorting-ui.assertion";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

type SortField = "name" | "price" | "co2";
type SortDirection = "asc" | "desc";

type SortCase = {
  label: string;
  value: string;
  field: SortField;
  direction: SortDirection;
  tags: ("@smoke" | "@regression")[];
};

const EXPECTED_SORT_OPTIONS = [
  { value: "name,asc", label: "Name (A - Z)" },
  { value: "name,desc", label: "Name (Z - A)" },
  { value: "price,desc", label: "Price (High - Low)" },
  { value: "price,asc", label: "Price (Low - High)" },
  { value: "co2_rating,asc", label: "CO₂ Rating (A - E)" },
  { value: "co2_rating,desc", label: "CO₂ Rating (E - A)" },
] as const;

const SORT_CASES: SortCase[] = [
  {
    label: "Name (A - Z)",
    value: "name,asc",
    field: "name",
    direction: "asc",
    tags: ["@regression"],
  },
  {
    label: "Name (Z - A)",
    value: "name,desc",
    field: "name",
    direction: "desc",
    tags: ["@regression"],
  },
  {
    label: "Price (High - Low)",
    value: "price,desc",
    field: "price",
    direction: "desc",
    tags: ["@regression"],
  },
  {
    label: "Price (Low - High)",
    value: "price,asc",
    field: "price",
    direction: "asc",
    tags: ["@smoke"],
  },
  {
    label: "CO₂ Rating (A - E)",
    value: "co2_rating,asc",
    field: "co2",
    direction: "asc",
    tags: ["@regression"],
  },
  {
    label: "CO₂ Rating (E - A)",
    value: "co2_rating,desc",
    field: "co2",
    direction: "desc",
    tags: ["@regression"],
  },
];

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

  for (const sortCase of SORT_CASES) {
    test(
      `orders visible product cards by ${sortCase.label}`,
      { tag: sortCase.tags },
      async ({ page, productsPage }) => {
        await applyAllureMetadata({
          ...PRODUCT_SORTING_UI_METADATA,
          story: `Sort option: ${sortCase.label}`,
          severity: sortCase.tags.includes("@smoke") ? "critical" : "normal",
        });

        await test.step("Open catalog page", async () => {
          await productsPage.open();
          await productsPage.waitForReady();
        });

        await test.step(`Apply sort option ${sortCase.label}`, async () => {
          const productsResponsePromise = page.waitForResponse((response) => {
            return (
              response.request().method() === "GET" &&
              response.url().includes("/products") &&
              response.url().includes(`sort=${sortCase.value}`)
            );
          });

          await productsPage.selectSort(sortCase.value);
          await productsResponsePromise;

          await expect(productsPage.sortSelect).toHaveValue(sortCase.value);
        });

        await test.step("Verify visible product cards are ordered for comparable values", async () => {
          if (sortCase.field === "name") {
            const names = await productsPage.getVisibleProductNames();
            const comparabilityIssue = getNameSortComparabilityIssue(names);

            test.skip(comparabilityIssue !== null, comparabilityIssue ?? "");
            expectNamesSorted(names, sortCase.direction);
            return;
          }

          if (sortCase.field === "price") {
            const prices = await productsPage.getVisibleProductPrices();
            const comparabilityIssue = getPriceSortComparabilityIssue(prices);

            test.skip(comparabilityIssue !== null, comparabilityIssue ?? "");
            expectPricesSorted(prices, sortCase.direction);
            return;
          }

          const ratings = await productsPage.getVisibleProductCo2Ratings();
          const comparabilityIssue = getCo2SortComparabilityIssue(ratings);

          test.skip(comparabilityIssue !== null, comparabilityIssue ?? "");
          expectCo2RatingsSorted(ratings, sortCase.direction);
        });
      },
    );
  }
});
