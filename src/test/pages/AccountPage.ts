import { type Locator, type Page } from "@playwright/test";

export class AccountPage {
  readonly accountHeading: Locator;
  readonly accountMenuButton: Locator;
  private readonly signOutButton: Locator;

  constructor(page: Page) {
    this.accountHeading = page.getByRole("heading", { name: "My account" });
    this.accountMenuButton = page.getByTestId("nav-menu");
    this.signOutButton = page.getByTestId("nav-sign-out");
  }

  async signOut(): Promise<void> {
    await this.accountMenuButton.click();
    await this.signOutButton.click();
  }
}
