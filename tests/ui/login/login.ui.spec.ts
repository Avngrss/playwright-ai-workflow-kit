import { registrationFormDataBuilder } from "../../../src/test/data/builders/registration-form-data.builder";
import { expect, test } from "../../../src/test/fixtures/test";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const LOGIN_UI_METADATA = {
  parentSuite: "UI",
  suite: "Login",
  feature: "Login",
  owner: "qa",
} as const;

test.describe("Login UI", { tag: ["@ui"] }, () => {
  test(
    "shows login page controls",
    { tag: ["@smoke"] },
    async ({ page, loginPage }) => {
      await applyAllureMetadata({
        ...LOGIN_UI_METADATA,
        story: "Login page default state",
        severity: "critical",
      });

      await test.step("Open login page", async () => {
        await loginPage.open();
        await loginPage.waitForReady();
      });

      await test.step("Verify login controls are visible", async () => {
        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(loginPage.loginForm).toBeVisible();
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.submitButton).toBeVisible();
      });
    },
  );

  test(
    "logs in successfully and opens account page",
    { tag: ["@smoke"] },
    async ({ accountPage, loginPage, page, registerPage }) => {
      const registrationData = registrationFormDataBuilder.build();
      await applyAllureMetadata({
        ...LOGIN_UI_METADATA,
        story: "Successful login journey",
        severity: "critical",
      });

      await test.step("Create fresh user precondition through registration flow", async () => {
        await registerPage.open();
        await registerPage.waitForReady();
        await registerPage.fillRegistrationForm(registrationData);
        await registerPage.submit();

        await expect(page).toHaveURL(/\/auth\/login$/);
      });

      await test.step("Submit valid credentials", async () => {
        await loginPage.open();
        await loginPage.waitForReady();
        await loginPage.login(registrationData.email, registrationData.password);
      });

      await test.step("Verify authenticated account area is opened", async () => {
        await accountPage.waitForReady();
        await expect(page).toHaveURL(/\/account$/);
        await expect(accountPage.pageTitle).toHaveText("My account");
      });
    },
  );

  test(
    "shows invalid credentials feedback",
    { tag: ["@regression"] },
    async ({ page, loginPage }) => {
      await applyAllureMetadata({
        ...LOGIN_UI_METADATA,
        story: "Invalid credentials handling",
        severity: "normal",
      });

      await test.step("Attempt login with invalid credentials", async () => {
        await loginPage.open();
        await loginPage.waitForReady();
        await loginPage.login("invalid-login@example.test", "wrong-password-123");
      });

      await test.step("Verify user remains on login page with error", async () => {
        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(loginPage.loginError).toBeVisible();
      });
    },
  );

  test(
    "shows required validation for empty login form submit",
    { tag: ["@regression"] },
    async ({ page, loginPage }) => {
      await applyAllureMetadata({
        ...LOGIN_UI_METADATA,
        story: "Required field validation",
        severity: "normal",
      });

      await test.step("Submit login form without credentials", async () => {
        await loginPage.open();
        await loginPage.waitForReady();
        await loginPage.submit();
      });

      await test.step("Verify required field feedback", async () => {
        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(loginPage.emailRequiredError).toBeVisible();
        await expect(loginPage.passwordRequiredError).toBeVisible();
      });
    },
  );
});
