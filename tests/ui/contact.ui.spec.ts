import { expect, test } from "../../src/test/fixtures/test";
import { createValidContactFormData } from "../../src/test/data/builders/contact-form.builder";
import { contactSubjectOptions } from "../../src/test/data/datasets/contact-subjects.dataset";
import { contactUploadAssets } from "../../src/test/data/datasets/contact-upload-assets.dataset";
import { applyAllureMetadata } from "../../src/test/reporting/allure-metadata.helper";

const invalidAttachmentCases = [
  {
    label: "non-zero-byte txt file",
    filePath: contactUploadAssets.invalidNonEmptyTxt,
  },
  {
    label: "non-txt file extension",
    filePath: contactUploadAssets.invalidExtensionPdf,
  },
] as const;

test.describe("Contact UI", { tag: ["@ui", "@contact"] }, () => {
  const commonMetadata = {
    feature: "Contact Us",
    suite: "Contact UI",
    owner: "qa",
    layer: "ui" as const,
    tags: ["contact"],
  };

  test.beforeEach(async ({ contactPage }) => {
    await applyAllureMetadata(commonMetadata);
    await contactPage.open();
    await expect(contactPage.heading).toBeVisible();
  });

  test(
    "shows contact form controls and attachment guidance",
    { tag: ["@smoke"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Contact form availability",
        severity: "CRITICAL",
      });

      await test.step("Verify required contact controls are visible", async () => {
        await expect(contactPage.firstNameInput).toBeVisible();
        await expect(contactPage.lastNameInput).toBeVisible();
        await expect(contactPage.emailInput).toBeVisible();
        await expect(contactPage.subjectSelect).toBeVisible();
        await expect(contactPage.messageInput).toBeVisible();
        await expect(contactPage.attachmentInput).toBeVisible();
        await expect(contactPage.submitButton).toBeVisible();
      });

      await test.step("Verify attachment guidance is visible", async () => {
        await expect(contactPage.attachmentHelpText).toBeVisible();
        await expect(contactPage.attachmentHelpText).toContainText("txt");
        await expect(contactPage.attachmentHelpText).toContainText("0kb");
      });
    },
  );

  test(
    "shows required-field validation on empty submit",
    { tag: ["@smoke"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Required field validation",
        severity: "CRITICAL",
      });

      await test.step("Submit the contact form without filling required fields", async () => {
        await contactPage.submit();
      });

      await test.step("Verify required-field feedback is visible", async () => {
        await expect(contactPage.firstNameRequiredError).toBeVisible();
        await expect(contactPage.lastNameRequiredError).toBeVisible();
        await expect(contactPage.emailRequiredError).toBeVisible();
        await expect(contactPage.subjectRequiredError).toBeVisible();
        await expect(contactPage.messageRequiredError).toBeVisible();
        await expect(contactPage.successAlert).not.toBeVisible();
      });
    },
  );

  test(
    "submits valid contact form and shows success confirmation",
    { tag: ["@smoke"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Successful plain contact submit",
        severity: "BLOCKER",
      });

      const contactData = createValidContactFormData();

      await test.step("Fill and submit the contact form", async () => {
        await contactPage.fillContactForm(contactData);
        await contactPage.submit();
      });

      await test.step("Verify success confirmation is visible", async () => {
        await expect(contactPage.successAlert).toBeVisible();
        await expect(contactPage.page).toHaveURL(/\/contact$/);
      });
    },
  );

  test(
    "shows invalid email validation feedback",
    { tag: ["@regression"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Invalid email validation",
        severity: "NORMAL",
      });

      const contactData = createValidContactFormData({
        email: "not-an-email",
        message:
          "This invalid email probe message has more than fifty characters total.",
      });

      await test.step("Submit contact form with invalid email format", async () => {
        await contactPage.fillContactForm(contactData);
        await contactPage.submit();
      });

      await test.step("Verify invalid email feedback is visible", async () => {
        await expect(contactPage.emailFormatError).toBeVisible();
        await expect(contactPage.successAlert).not.toBeVisible();
      });
    },
  );

  test(
    "shows message minimum-length validation feedback",
    { tag: ["@regression"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Message minimum-length validation",
        severity: "NORMAL",
      });

      const contactData = createValidContactFormData({
        message: "Too short message.",
      });

      await test.step("Submit contact form with a short message", async () => {
        await contactPage.fillContactForm(contactData);
        await contactPage.submit();
      });

      await test.step("Verify minimum-length feedback is visible", async () => {
        await expect(contactPage.messageMinLengthError).toBeVisible();
        await expect(contactPage.successAlert).not.toBeVisible();
      });
    },
  );

  test(
    "allows selecting each supported subject option",
    { tag: ["@regression"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Supported subject options",
        severity: "NORMAL",
      });

      for (const subjectLabel of contactSubjectOptions) {
        await test.step(`Select subject option: ${subjectLabel}`, async () => {
          await contactPage.selectSubject(subjectLabel);
          await expect(
            contactPage.subjectSelect.locator("option:checked"),
          ).toHaveText(subjectLabel);
        });
      }
    },
  );

  test(
    "submits valid contact form with empty txt attachment and shows success confirmation",
    { tag: ["@regression"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Successful submit with valid attachment",
        severity: "NORMAL",
      });

      const contactData = createValidContactFormData();

      await test.step("Fill contact form and upload valid empty txt attachment", async () => {
        await contactPage.fillContactForm(contactData);
        await contactPage.uploadAttachment(contactUploadAssets.validEmptyTxt);
        await contactPage.submit();
      });

      await test.step("Verify success confirmation is visible", async () => {
        await expect(contactPage.successAlert).toBeVisible();
      });
    },
  );

  test(
    "shows attachment rejection feedback for invalid uploads",
    { tag: ["@regression"] },
    async ({ contactPage }) => {
      await applyAllureMetadata({
        story: "Invalid attachment validation",
        severity: "NORMAL",
      });

      for (const invalidAttachmentCase of invalidAttachmentCases) {
        await test.step(`Reject invalid attachment: ${invalidAttachmentCase.label}`, async () => {
          await contactPage.open();
          await expect(contactPage.heading).toBeVisible();

          await contactPage.fillContactForm(createValidContactFormData());
          await contactPage.uploadAttachment(invalidAttachmentCase.filePath);
          await contactPage.submit();

          await expect(contactPage.attachmentEmptyFileError).toBeVisible();
          await expect(contactPage.successAlert).not.toBeVisible();
        });
      }
    },
  );
});
