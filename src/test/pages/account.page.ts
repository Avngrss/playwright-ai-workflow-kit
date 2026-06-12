import type { Locator, Page } from "@playwright/test";

export class AccountPage {
  readonly pageTitle: Locator;

  constructor(private readonly page: Page) {
    this.pageTitle = page.getByTestId("page-title");
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/account$/);
    await this.pageTitle.waitFor({ state: "visible", timeout: 20000 });
  }
}
