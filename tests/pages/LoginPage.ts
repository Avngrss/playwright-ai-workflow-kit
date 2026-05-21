import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly loginButton: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;

  constructor(page: Page) {
    this.emailInput = page.getByLabel("Email address *");
    this.passwordInput = page.getByLabel("Password *");
    this.loginButton = page.getByTestId("login-submit");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
