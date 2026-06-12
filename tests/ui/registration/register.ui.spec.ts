import { registrationFormDataBuilder } from "../../../src/test/data/builders/registration-form-data.builder";
import { registrationUserRequestBuilder } from "../../../src/test/data/builders/registration-user-request.builder";
import { expect, test } from "../../../src/test/fixtures/test";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const registrationUiMetadata = {
  parentSuite: "UI",
  suite: "Registration",
  feature: "Registration",
  owner: "qa",
} as const;

test.describe("Registration UI", { tag: ["@ui"] }, () => {
  test(
    "registers a user and redirects to login",
    { tag: ["@regression", "@visual"] },
    async ({ page, loginPage, registerPage }) => {
      const registrationData = registrationFormDataBuilder.build();
      await applyAllureMetadata({
        ...registrationUiMetadata,
        story: "Happy path registration",
        severity: "critical",
      });

      await test.step("Open registration form", async () => {
        await registerPage.open();
        await registerPage.waitForReady();

        await expect(registerPage.firstNameInput).toBeVisible();
        await expect(registerPage.lastNameInput).toBeVisible();
        await expect(registerPage.emailInput).toBeVisible();
        await expect(registerPage.passwordInput).toBeVisible();
        await expect(registerPage.countrySelect).toBeVisible();
        await expect(registerPage.submitButton).toBeVisible();
      });

      await test.step("Capture registration default form visual checkpoint", async () => {
        await expect(registerPage.registrationForm).toHaveScreenshot(
          "registration-form-default.png",
        );
      });

      await test.step("Fill required form fields and submit", async () => {
        await registerPage.fillRegistrationForm(registrationData);
        await registerPage.submit();
      });

      await test.step("Verify user is redirected to login page", async () => {
        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(loginPage.emailInput).toBeVisible();
      });
    },
  );

  test(
    "shows required field feedback when submitting empty form",
    { tag: ["@regression"] },
    async ({ page, registerPage }) => {
      await applyAllureMetadata({
        ...registrationUiMetadata,
        story: "Required validation feedback",
        severity: "normal",
      });

      await test.step("Open registration form", async () => {
        await registerPage.open();
        await registerPage.waitForReady();
      });

      await test.step("Submit form without entering values", async () => {
        await registerPage.submit();
      });

      await test.step("Verify required validation messages are shown", async () => {
        await expect(page).toHaveURL(/\/auth\/register$/);
        await expect(registerPage.firstNameRequiredError).toBeVisible();
        await expect(registerPage.lastNameRequiredError).toBeVisible();
        await expect(registerPage.countryRequiredError).toBeVisible();
        await expect(registerPage.emailRequiredError).toBeVisible();
        await expect(registerPage.passwordRequiredError).toBeVisible();
      });
    },
  );

  test(
    "shows duplicate email feedback and stays on registration page",
    { tag: ["@regression"] },
    async ({ page, loginPage, registerPage }) => {
      const existingUser = registrationUserRequestBuilder.build();
      const duplicateData = registrationFormDataBuilder.build({
        email: existingUser.email,
        password: existingUser.password,
      });
      await applyAllureMetadata({
        ...registrationUiMetadata,
        story: "Duplicate email feedback",
        severity: "normal",
      });

      await test.step("Create existing user through UI precondition setup", async () => {
        await registerPage.open();
        await registerPage.waitForReady();
        await registerPage.fillRegistrationForm(duplicateData);
        await registerPage.submit();

        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(loginPage.emailInput).toBeVisible();
      });

      await test.step("Submit registration form with duplicate email", async () => {
        await registerPage.open();
        await registerPage.waitForReady();
        await registerPage.fillRegistrationForm(duplicateData);
        await registerPage.submit();
      });

      await test.step("Verify duplicate email feedback on registration page", async () => {
        await expect(page).toHaveURL(/\/auth\/register$/);
        await expect(registerPage.duplicateEmailError).toBeVisible();
      });
    },
  );
});
