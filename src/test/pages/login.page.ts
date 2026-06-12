import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginError: Locator;
  readonly emailRequiredError: Locator;
  readonly passwordRequiredError: Locator;

  constructor(private readonly page: Page) {
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("email");
    this.passwordInput = page.getByTestId("password");
    this.submitButton = page.getByTestId("login-submit");
    this.loginError = page.getByTestId("login-error");
    this.emailRequiredError = page.getByText("Email is required");
    this.passwordRequiredError = page.getByText("Password is required");
  }

  async open(): Promise<void> {
    await this.page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/auth\/login$/);
    await this.loginForm.waitFor({ state: "visible", timeout: 20000 });
    await this.emailInput.waitFor({ state: "visible", timeout: 20000 });
    await this.passwordInput.waitFor({ state: "visible", timeout: 20000 });
    await this.submitButton.waitFor({ state: "visible", timeout: 20000 });
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }
}
