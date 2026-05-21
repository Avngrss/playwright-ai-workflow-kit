import { type Locator, type Page } from "@playwright/test";

export class AccountPage {
  readonly accountHeading: Locator;
  readonly accountMenuButton: Locator;

  constructor(page: Page) {
    this.accountHeading = page.getByRole("heading", { name: "My account" });
    this.accountMenuButton = page.getByTestId("nav-menu");
  }
}
