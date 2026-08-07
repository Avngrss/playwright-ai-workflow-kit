import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerAccountLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly invalidCredentialsError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Login" });
    this.emailInput = page.getByTestId("email");
    this.passwordInput = page.getByTestId("password");
    this.loginButton = page.getByTestId("login-submit");
    this.registerAccountLink = page.getByRole("link", {
      name: "Register your account",
    });
    this.forgotPasswordLink = page.getByRole("link", {
      name: "Forgot your Password?",
    });
    this.invalidCredentialsError = page.getByText("Invalid email or password");
  }

  async open(): Promise<void> {
    await this.page.goto("/auth/login");
  }

  async fillCredentials(credentials: {
    email: string;
    password: string;
  }): Promise<void> {
    await this.emailInput.fill(credentials.email);
    await this.passwordInput.fill(credentials.password);
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }
}
