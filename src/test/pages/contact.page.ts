import type { Locator, Page } from "@playwright/test";

import type { ContactFormData } from "../data/types/contact-form-data.type";

export class ContactPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectSelect: Locator;
  readonly messageInput: Locator;
  readonly attachmentInput: Locator;
  readonly submitButton: Locator;
  readonly attachmentHelpText: Locator;
  readonly successAlert: Locator;
  readonly firstNameRequiredError: Locator;
  readonly lastNameRequiredError: Locator;
  readonly emailRequiredError: Locator;
  readonly subjectRequiredError: Locator;
  readonly messageRequiredError: Locator;
  readonly emailFormatError: Locator;
  readonly messageMinLengthError: Locator;
  readonly attachmentEmptyFileError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Contact" });
    this.firstNameInput = page.getByTestId("first-name");
    this.lastNameInput = page.getByTestId("last-name");
    this.emailInput = page.getByTestId("email");
    this.subjectSelect = page.getByTestId("subject");
    this.messageInput = page.getByTestId("message");
    this.attachmentInput = page.getByTestId("attachment");
    this.submitButton = page.getByTestId("contact-submit");
    this.attachmentHelpText = page.getByText(
      "Only files with the txt extension are allowed, and files must be 0kb.",
    );
    this.successAlert = page.getByText(
      "Thanks for your message! We will contact you shortly.",
    );
    this.firstNameRequiredError = page.getByText("First name is required");
    this.lastNameRequiredError = page.getByText("Last name is required");
    this.emailRequiredError = page.getByText("Email is required");
    this.subjectRequiredError = page.getByText("Subject is required");
    this.messageRequiredError = page.getByText("Message is required");
    this.emailFormatError = page.getByText("Email format is invalid");
    this.messageMinLengthError = page.getByText(
      "Message must be minimal 50 characters",
    );
    this.attachmentEmptyFileError = page.getByText("File should be empty.");
  }

  async open(): Promise<void> {
    await this.page.goto("/contact");
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async selectSubject(subjectLabel: string): Promise<void> {
    await this.subjectSelect.selectOption({ label: subjectLabel });
  }

  async uploadAttachment(filePath: string): Promise<void> {
    await this.attachmentInput.setInputFiles(filePath);
  }

  async fillContactForm(data: ContactFormData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.selectSubject(data.subject);
    await this.messageInput.fill(data.message);
  }
}
