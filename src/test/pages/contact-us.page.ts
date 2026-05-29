import { Locator, Page } from "@playwright/test";
import { ContactUsFormData } from "../data/types/contact-us-form.type";

export class ContactUsPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly getInTouchHeading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectInput: Locator;
  readonly messageInput: Locator;
  readonly fileInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly postSubmitHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole("heading", { name: /contact us/i });
    this.getInTouchHeading = page.getByRole("heading", { name: /get in touch/i });
    this.nameInput = page.getByTestId("name");
    this.emailInput = page.getByTestId("email");
    this.subjectInput = page.getByTestId("subject");
    this.messageInput = page.getByTestId("message");
    this.fileInput = page.locator('input[name="upload_file"]');
    this.submitButton = page.getByTestId("submit-button");
    this.successMessage = page.locator("#contact-page .status.alert.alert-success");
    this.postSubmitHomeButton = page.locator("#form-section").getByRole("link", { name: "Home" });
  }

  async open(): Promise<void> {
    await this.page.goto("/contact_us");
  }

  async fillForm(data: ContactUsFormData): Promise<void> {
    if (data.name !== undefined) {
      await this.nameInput.fill(data.name);
    }

    if (data.email !== undefined) {
      await this.emailInput.fill(data.email);
    }

    if (data.subject !== undefined) {
      await this.subjectInput.fill(data.subject);
    }

    if (data.message !== undefined) {
      await this.messageInput.fill(data.message);
    }
  }

  async uploadFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async isEmailFieldValid(): Promise<boolean> {
    return this.emailInput.evaluate(
      (element) => (element as HTMLInputElement).checkValidity()
    );
  }
}
