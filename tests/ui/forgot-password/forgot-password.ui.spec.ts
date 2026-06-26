import { expect, test } from "../../../src/test/fixtures/test";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const FORGOT_PASSWORD_UI_METADATA = {
  parentSuite: "UI",
  suite: "Forgot Password",
  feature: "Forgot Password",
  owner: "qa",
} as const;

const VALID_FORGOT_PASSWORD_EMAIL = "customer@practicesoftwaretesting.com";

test.describe("Forgot Password UI", { tag: ["@ui", "@auth"] }, () => {
  test(
    "shows forgot-password page controls",
    { tag: ["@smoke"] },
    async ({ forgotPasswordPage, page }) => {
      await applyAllureMetadata({
        ...FORGOT_PASSWORD_UI_METADATA,
        story: "Forgot-password page default state",
        severity: "critical",
      });

      await test.step("Open forgot-password page", async () => {
        await forgotPasswordPage.open();
        await forgotPasswordPage.waitForReady();
      });

      await test.step("Verify forgot-password controls are visible", async () => {
        await expect(page).toHaveURL(/\/auth\/forgot-password\/?$/);
        await expect(forgotPasswordPage.forgotPasswordForm).toBeVisible();
        await expect(forgotPasswordPage.emailInput).toBeVisible();
        await expect(forgotPasswordPage.submitButton).toBeVisible();
        await expect(forgotPasswordPage.emailInput).toBeEditable();
        await expect(forgotPasswordPage.submitButton).toBeEnabled();
      });
    },
  );

  test(
    "shows required validation feedback when email is missing",
    { tag: ["@regression"] },
    async ({ forgotPasswordPage, page }) => {
      await applyAllureMetadata({
        ...FORGOT_PASSWORD_UI_METADATA,
        story: "Required email validation feedback",
        severity: "normal",
      });

      await test.step("Submit forgot-password form without email", async () => {
        await forgotPasswordPage.open();
        await forgotPasswordPage.waitForReady();
        await forgotPasswordPage.submit();
      });

      await test.step("Verify required email feedback is shown", async () => {
        await expect(page).toHaveURL(/\/auth\/forgot-password\/?$/);
        await expect(forgotPasswordPage.emailError).toBeVisible();
      });
    },
  );

  test(
    "shows confirmation feedback after valid email submit",
    { tag: ["@smoke"] },
    async ({ forgotPasswordPage, page }) => {
      await applyAllureMetadata({
        ...FORGOT_PASSWORD_UI_METADATA,
        story: "Forgot-password submit success feedback",
        severity: "critical",
      });

      await test.step("Submit forgot-password form with a valid email", async () => {
        await forgotPasswordPage.open();
        await forgotPasswordPage.waitForReady();
        await forgotPasswordPage.fillEmail(VALID_FORGOT_PASSWORD_EMAIL);
        await forgotPasswordPage.submit();
      });

      await test.step("Verify confirmation feedback is visible", async () => {
        await expect(page).toHaveURL(/\/auth\/forgot-password\/?$/);
        await expect(forgotPasswordPage.successAlert).toBeVisible();
      });
    },
  );
});
