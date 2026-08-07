import type { Locator, Page } from "@playwright/test";

export class AccountPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "My account" });
  }
}
