import type { Locator, Page } from "@playwright/test";

export class ContactPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectSelect: Locator;
  readonly messageInput: Locator;
  readonly attachmentInput: Locator;
  readonly submitButton: Locator;
  readonly successAlert: Locator;

  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly emailError: Locator;
  readonly subjectError: Locator;
  readonly messageError: Locator;
  readonly attachmentError: Locator;

  constructor(private readonly page: Page) {
    this.firstNameInput = page.getByTestId("first-name");
    this.lastNameInput = page.getByTestId("last-name");
    this.emailInput = page.getByTestId("email");
    this.subjectSelect = page.getByTestId("subject");
    this.messageInput = page.getByTestId("message");
    this.attachmentInput = page.getByTestId("attachment");
    this.submitButton = page.getByTestId("contact-submit");
    this.successAlert = page.locator(".alert-success");

    this.firstNameError = page.getByTestId("first-name-error");
    this.lastNameError = page.getByTestId("last-name-error");
    this.emailError = page.getByTestId("email-error");
    this.subjectError = page.getByTestId("subject-error");
    this.messageError = page.getByTestId("message-error");
    this.attachmentError = page.getByTestId("attachment-error");
  }

  async open(): Promise<void> {
    await this.page.goto("/contact", { waitUntil: "domcontentloaded" });
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/contact\/?$/);
    await this.subjectSelect.waitFor({ state: "visible", timeout: 20000 });
    await this.messageInput.waitFor({ state: "visible", timeout: 20000 });
    await this.submitButton.waitFor({ state: "visible", timeout: 20000 });
  }

  async fillGuestIdentity(
    firstName: string,
    lastName: string,
    email: string,
  ): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
  }

  async selectSubject(subject: string): Promise<void> {
    await this.subjectSelect.selectOption(subject);
  }

  async fillMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
  }

  async blurMessage(): Promise<void> {
    await this.messageInput.blur();
  }

  async uploadAttachment(file: {
    name: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<void> {
    await this.attachmentInput.setInputFiles(file);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
