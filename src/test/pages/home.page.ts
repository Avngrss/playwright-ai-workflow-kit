import { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heroBannerText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroBannerText = page
      .getByRole("heading", { name: /full-fledged practice website/i })
      .first();
  }
}
