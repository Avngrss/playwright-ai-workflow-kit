import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly emailInput: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByTestId("email");
  }
}
