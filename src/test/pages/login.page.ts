import { Locator, Page } from "@playwright/test";
import {
  LoginCredentials,
  SignupEntryData,
} from "../data/types/login-signup.type";

export class LoginPage {
  readonly page: Page;
  readonly loginHeading: Locator;
  readonly signupHeading: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;
  readonly loginErrorMessage: Locator;
  readonly loggedInAsLabel: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginHeading = page.getByRole("heading", { name: /login to your account/i });
    this.signupHeading = page.getByRole("heading", { name: /new user signup!/i });
    this.loginEmailInput = page.getByTestId("login-email");
    this.loginPasswordInput = page.getByTestId("login-password");
    this.loginButton = page.getByTestId("login-button");
    this.signupNameInput = page.getByTestId("signup-name");
    this.signupEmailInput = page.getByTestId("signup-email");
    this.signupButton = page.getByTestId("signup-button");
    this.loginErrorMessage = page.getByText("Your email or password is incorrect!");
    this.loggedInAsLabel = page.getByText(/logged in as/i);
    this.logoutLink = page.getByRole("link", { name: /logout/i });
  }

  async open(): Promise<void> {
    await this.page.goto("/login");
  }

  async fillLoginForm(credentials: LoginCredentials): Promise<void> {
    await this.loginEmailInput.fill(credentials.email);
    await this.loginPasswordInput.fill(credentials.password);
  }

  async submitLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async fillSignupEntry(data: SignupEntryData): Promise<void> {
    await this.signupNameInput.fill(data.name);
    await this.signupEmailInput.fill(data.email);
  }

  async submitSignup(): Promise<void> {
    await this.signupButton.click();
  }

  async isLoginEmailValid(): Promise<boolean> {
    return this.loginEmailInput.evaluate(
      (element) => (element as HTMLInputElement).checkValidity()
    );
  }

  async isLoginPasswordValid(): Promise<boolean> {
    return this.loginPasswordInput.evaluate(
      (element) => (element as HTMLInputElement).checkValidity()
    );
  }
}
