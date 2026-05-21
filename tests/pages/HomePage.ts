import { type Locator, type Page } from "@playwright/test";

export class HomePage {
  private readonly page: Page;
  private readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signInLink = page.getByTestId("nav-sign-in");
  }

  async open(): Promise<void> {
    await this.page.goto("/");
  }

  async openLogin(): Promise<void> {
    await this.signInLink.click();
  }
}
