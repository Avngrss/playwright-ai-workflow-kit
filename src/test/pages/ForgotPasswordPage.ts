import { type Locator, type Page } from "@playwright/test";

export class ForgotPasswordPage {
  readonly forgotPasswordForm: Locator;
  readonly submitButton: Locator;
  readonly emailError: Locator;
  readonly feedbackAlert: Locator;
  private readonly page: Page;
  private readonly emailInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.forgotPasswordForm = page.getByTestId("forgot-password-form");
    this.emailInput = page.getByTestId("email");
    this.submitButton = page.getByTestId("forgot-password-submit");
    this.emailError = page.getByTestId("email-error");
    this.feedbackAlert = page.getByRole("alert");
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(/\/auth\/forgot-password$/);
    await this.forgotPasswordForm.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "visible" });
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async requestReset(email: string): Promise<void> {
    await this.fillEmail(email);
    await this.submit();
  }

  async getEmailValue(): Promise<string> {
    return this.emailInput.inputValue();
  }

  async getEmailValidationMessage(): Promise<string> {
    return this.emailInput.evaluate(
      (input) => (input as HTMLInputElement).validationMessage,
    );
  }
}
