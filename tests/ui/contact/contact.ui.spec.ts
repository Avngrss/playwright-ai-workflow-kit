import { expect, test } from "../../../src/test/fixtures/test";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const CONTACT_UI_METADATA = {
  parentSuite: "UI",
  suite: "Contact",
  feature: "Contact Us",
  owner: "qa",
} as const;

const VALID_CONTACT_MESSAGE =
  "I am contacting support because I need help with a recent order and would like a status update from your team.";

const INVALID_CONTACT_MESSAGE = "Need help soon.";

const CONTACT_SUBJECT_OPTIONS = [
  "customer-service",
  "webmaster",
  "return",
  "payments",
  "warranty",
  "status-of-order",
] as const;

test.describe("Contact UI", { tag: ["@ui", "@contact"] }, () => {
  test(
    "shows contact page controls",
    { tag: ["@smoke"] },
    async ({ contactPage, page }) => {
      await applyAllureMetadata({
        ...CONTACT_UI_METADATA,
        story: "Contact page default state",
        severity: "critical",
      });

      await test.step("Open contact page", async () => {
        await contactPage.open();
        await contactPage.waitForReady();
      });

      await test.step("Verify contact controls are visible", async () => {
        await expect(page).toHaveURL(/\/contact\/?$/);
        await expect(contactPage.firstNameInput).toBeVisible();
        await expect(contactPage.lastNameInput).toBeVisible();
        await expect(contactPage.emailInput).toBeVisible();
        await expect(contactPage.subjectSelect).toBeVisible();
        await expect(contactPage.messageInput).toBeVisible();
        await expect(contactPage.attachmentInput).toBeVisible();
        await expect(contactPage.submitButton).toBeVisible();
      });
    },
  );

  test(
    "submits contact form successfully for a guest user",
    { tag: ["@smoke"] },
    async ({ contactPage, page }) => {
      await applyAllureMetadata({
        ...CONTACT_UI_METADATA,
        story: "Guest contact submission",
        severity: "critical",
      });

      await test.step("Open contact page", async () => {
        await contactPage.open();
        await contactPage.waitForReady();
      });

      await test.step("Fill guest contact details and submit", async () => {
        await contactPage.fillGuestIdentity(
          "Api",
          "Guest",
          "guest-contact@example.test",
        );
        await contactPage.selectSubject("customer-service");
        await contactPage.fillMessage(VALID_CONTACT_MESSAGE);
        await contactPage.submit();
      });

      await test.step("Verify success confirmation is shown", async () => {
        await expect(page).toHaveURL(/\/contact\/?$/);
        await expect(contactPage.successAlert).toBeVisible();
      });
    },
  );

  test(
    "shows required validation feedback when submitting empty form",
    { tag: ["@regression"] },
    async ({ contactPage, page }) => {
      await applyAllureMetadata({
        ...CONTACT_UI_METADATA,
        story: "Required validation feedback",
        severity: "normal",
      });

      await test.step("Open contact page", async () => {
        await contactPage.open();
        await contactPage.waitForReady();
      });

      await test.step("Submit contact form without entering values", async () => {
        await contactPage.submit();
      });

      await test.step("Verify required validation messages are shown", async () => {
        await expect(page).toHaveURL(/\/contact\/?$/);
        await expect(contactPage.firstNameError).toBeVisible();
        await expect(contactPage.lastNameError).toBeVisible();
        await expect(contactPage.emailError).toBeVisible();
        await expect(contactPage.subjectError).toBeVisible();
        await expect(contactPage.messageError).toBeVisible();
      });
    },
  );

  test(
    "shows validation feedback for invalid email and short message",
    { tag: ["@regression"] },
    async ({ contactPage, page }) => {
      await applyAllureMetadata({
        ...CONTACT_UI_METADATA,
        story: "Invalid email and short message validation",
        severity: "normal",
      });

      await test.step("Open contact page", async () => {
        await contactPage.open();
        await contactPage.waitForReady();
      });

      await test.step("Fill form with invalid email and short message", async () => {
        await contactPage.fillGuestIdentity("Api", "Guest", "invalid-email");
        await contactPage.selectSubject("customer-service");
        await contactPage.fillMessage(INVALID_CONTACT_MESSAGE);
        await contactPage.blurMessage();
      });

      await test.step("Submit form and verify validation errors", async () => {
        await contactPage.submit();

        await expect(page).toHaveURL(/\/contact\/?$/);
        await expect(contactPage.emailError).toBeVisible();
        await expect(contactPage.messageError).toBeVisible();
      });
    },
  );

  test(
    "shows invalid attachment type feedback",
    { tag: ["@regression"] },
    async ({ contactPage, page }) => {
      await applyAllureMetadata({
        ...CONTACT_UI_METADATA,
        story: "Invalid attachment type handling",
        severity: "normal",
      });

      await test.step("Open contact page", async () => {
        await contactPage.open();
        await contactPage.waitForReady();
      });

      await test.step("Fill valid form fields and upload unsupported attachment", async () => {
        await contactPage.fillGuestIdentity(
          "Attachment",
          "User",
          "attachment-user@example.test",
        );
        await contactPage.selectSubject("customer-service");
        await contactPage.fillMessage(VALID_CONTACT_MESSAGE);
        await contactPage.uploadAttachment({
          name: "invalid-type.png",
          mimeType: "image/png",
          buffer: Buffer.alloc(0),
        });
        await contactPage.submit();
      });

      await test.step("Verify attachment error feedback is shown", async () => {
        await expect(page).toHaveURL(/\/contact\/?$/);
        await expect(contactPage.attachmentError).toBeVisible();
        await expect(contactPage.successAlert).not.toBeVisible();
      });
    },
  );

  test(
    "supports all planned contact subject options",
    { tag: ["@regression"] },
    async ({ contactPage, page }) => {
      await applyAllureMetadata({
        ...CONTACT_UI_METADATA,
        story: "Subject option coverage",
        severity: "normal",
      });

      await test.step("Open contact page", async () => {
        await contactPage.open();
        await contactPage.waitForReady();
      });

      await test.step("Select each supported subject option", async () => {
        for (const subjectOption of CONTACT_SUBJECT_OPTIONS) {
          await contactPage.selectSubject(subjectOption);
          await expect(contactPage.subjectSelect).toHaveValue(subjectOption);
        }
      });

      await test.step("Verify user remains on contact page", async () => {
        await expect(page).toHaveURL(/\/contact\/?$/);
      });
    },
  );
});
