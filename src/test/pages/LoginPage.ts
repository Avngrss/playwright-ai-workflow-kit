import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly loginForm: Locator;
  readonly loginButton: Locator;
  readonly loginError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;

  constructor(page: Page) {
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("email");
    this.passwordInput = page.getByTestId("password");
    this.loginButton = page.getByTestId("login-submit");
    this.loginError = page.getByTestId("login-error");
    this.emailError = page.getByTestId("email-error");
    this.passwordError = page.getByTestId("password-error");
    this.registerLink = page.getByTestId("register-link");
    this.forgotPasswordLink = page.getByTestId("forgot-password-link");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  async openRegister(): Promise<void> {
    await this.registerLink.click();
  }

  async openForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }
}
