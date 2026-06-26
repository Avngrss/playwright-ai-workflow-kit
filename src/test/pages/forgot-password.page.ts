import type { Locator, Page } from "@playwright/test";

export class ForgotPasswordPage {
  readonly forgotPasswordForm: Locator;
  readonly emailInput: Locator;
  readonly emailError: Locator;
  readonly submitButton: Locator;
  readonly successAlert: Locator;

  constructor(private readonly page: Page) {
    this.forgotPasswordForm = page.getByTestId("forgot-password-form");
    this.emailInput = page.getByTestId("email");
    this.emailError = page.getByTestId("email-error");
    this.submitButton = page.getByTestId("forgot-password-submit");
    this.successAlert = page.locator(".alert-success[role='alert']");
  }

  async open(): Promise<void> {
    await this.page.goto("/auth/forgot-password", { waitUntil: "domcontentloaded" });
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/auth\/forgot-password\/?$/);
    await this.forgotPasswordForm.waitFor({ state: "visible", timeout: 20000 });
    await this.emailInput.waitFor({ state: "visible", timeout: 20000 });
    await this.submitButton.waitFor({ state: "visible", timeout: 20000 });
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
