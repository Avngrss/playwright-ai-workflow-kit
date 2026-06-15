import type { Locator, Page } from "@playwright/test";

type SortOption = {
  value: string;
  label: string;
};

export class ProductsPage {
  readonly sortSelect: Locator;
  readonly productCards: Locator;

  constructor(private readonly page: Page) {
    this.sortSelect = page.getByTestId("sort");
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
}
