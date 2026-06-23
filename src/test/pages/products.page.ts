import type { Locator, Page } from "@playwright/test";

type SortOption = {
  value: string;
  label: string;
};

export class ProductsPage {
  readonly filtersPanel: Locator;
  readonly sortSelect: Locator;
  readonly priceRangeHeading: Locator;
  readonly priceRangeMinHandle: Locator;
  readonly priceRangeMaxHandle: Locator;
  readonly productCards: Locator;

  constructor(private readonly page: Page) {
    this.filtersPanel = page.locator('div[data-test="filters"]');
    this.sortSelect = page.getByTestId("sort");
    this.priceRangeHeading = page.getByRole("heading", { name: "Price Range" });
    this.priceRangeMinHandle = page.locator(
      '[data-test="filters"] [role="slider"][aria-label="ngx-slider"]',
    );
    this.priceRangeMaxHandle = page.locator(
      '[data-test="filters"] [role="slider"][aria-label="ngx-slider-max"]',
    );
    this.productCards = page.locator(
      '[data-test^="product-"]:not([data-test="product-name"]):not([data-test="product-price"])',
    );
  }

  async open(): Promise<void> {
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/$/);
    await this.sortSelect.waitFor({ state: "visible", timeout: 20000 });
    await this.productCards.first().waitFor({ state: "visible", timeout: 20000 });
  }

  async selectSort(value: string): Promise<void> {
    await this.sortSelect.selectOption(value);
  }

  async getPriceRangeValues(): Promise<{ min: number; max: number }> {
    return {
      min: await this.getSliderHandleValue(this.priceRangeMinHandle, "minimum"),
      max: await this.getSliderHandleValue(this.priceRangeMaxHandle, "maximum"),
    };
  }

  async setPriceRange(min: number, max: number): Promise<void> {
    if (min > max) {
      throw new Error(`Invalid price range: minimum (${min}) cannot exceed maximum (${max}).`);
    }

    await this.priceRangeMinHandle.waitFor({ state: "visible", timeout: 20000 });
    await this.priceRangeMaxHandle.waitFor({ state: "visible", timeout: 20000 });

    await this.moveSliderHandleTo(this.priceRangeMinHandle, min, "minimum");
    await this.moveSliderHandleTo(this.priceRangeMaxHandle, max, "maximum");

    const values = await this.getPriceRangeValues();
    if (values.min !== min || values.max !== max) {
      throw new Error(
        `Unable to set price range to ${min}-${max}. Current values: ${values.min}-${values.max}.`,
      );
    }
  }

  async getSortOptions(): Promise<SortOption[]> {
    return this.sortSelect.evaluate((select) => {
      return Array.from((select as HTMLSelectElement).options)
        .map((option) => ({
          value: option.value,
          label: (option.textContent ?? "").trim(),
        }))
        .filter((option) => option.value.length > 0 && option.label.length > 0);
    });
  }

  async getVisibleProductNames(): Promise<string[]> {
    const cardCount = await this.productCards.count();
    const names: string[] = [];

    for (let index = 0; index < cardCount; index += 1) {
      const card = this.productCards.nth(index);
      const name = (await card.getByTestId("product-name").textContent()) ?? "";
      names.push(name.trim());
    }

    return names;
  }

  async getVisibleProductPrices(): Promise<number[]> {
    const cardCount = await this.productCards.count();
    const prices: number[] = [];

    for (let index = 0; index < cardCount; index += 1) {
      const card = this.productCards.nth(index);
      const priceText = (await card.getByTestId("product-price").textContent()) ?? "";
      const match = priceText.match(/-?\d+(?:\.\d+)?/);
      const value = match ? Number(match[0]) : Number.NaN;
      prices.push(value);
    }

    return prices;
  }

  async getVisibleProductCo2Ratings(): Promise<string[]> {
    const cardCount = await this.productCards.count();
    const ratings: string[] = [];

    for (let index = 0; index < cardCount; index += 1) {
      const card = this.productCards.nth(index);
      const ratingText =
        (await card.locator('[data-test="co2-rating-badge"] .co2-letter.active').textContent()) ??
        "";
      ratings.push(ratingText.trim().toUpperCase());
    }

    return ratings;
  }

  private async getSliderHandleValue(handle: Locator, handleName: string): Promise<number> {
    const rawValue = await handle.getAttribute("aria-valuenow");
    const value = rawValue === null ? Number.NaN : Number(rawValue);

    if (Number.isNaN(value)) {
      throw new Error(`Price range ${handleName} handle has invalid value: ${rawValue ?? "null"}.`);
    }

    return value;
  }

  private async moveSliderHandleTo(
    handle: Locator,
    target: number,
    handleName: string,
  ): Promise<void> {
    const minBoundRaw = await handle.getAttribute("aria-valuemin");
    const maxBoundRaw = await handle.getAttribute("aria-valuemax");
    const minBound = minBoundRaw === null ? Number.NaN : Number(minBoundRaw);
    const maxBound = maxBoundRaw === null ? Number.NaN : Number(maxBoundRaw);

    if (Number.isNaN(minBound) || Number.isNaN(maxBound)) {
      throw new Error(
        `Price range ${handleName} handle bounds are invalid: min=${minBoundRaw}, max=${maxBoundRaw}.`,
      );
    }

    if (target < minBound || target > maxBound) {
      throw new Error(
        `Target ${target} is outside ${handleName} handle bounds ${minBound}-${maxBound}.`,
      );
    }

    let current = await this.getSliderHandleValue(handle, handleName);
    if (current === target) {
      return;
    }

    await handle.click();
    const maxSteps = Math.abs(target - current) + 25;
    let staleSteps = 0;

    for (let step = 0; step < maxSteps; step += 1) {
      await handle.press(target > current ? "ArrowRight" : "ArrowLeft");
      const next = await this.getSliderHandleValue(handle, handleName);

      if (next === target) {
        return;
      }

      if (next === current) {
        staleSteps += 1;
        if (staleSteps >= 3) {
          break;
        }
        continue;
      }

      staleSteps = 0;
      current = next;
    }

    throw new Error(
      `Unable to move ${handleName} price handle to ${target}. Last observed value: ${current}.`,
    );
  }
}
