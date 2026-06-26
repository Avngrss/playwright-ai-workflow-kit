import { registrationFormDataBuilder } from "../../../src/test/data/builders/registration-form-data.builder";
import { expect, test } from "../../../src/test/fixtures/test";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const USER_ONBOARDING_E2E_METADATA = {
  parentSuite: "E2E",
  suite: "Auth",
  feature: "User Onboarding",
  owner: "qa",
} as const;

test.describe("User Onboarding E2E", { tag: ["@e2e", "@auth"] }, () => {
  test(
    "registers, logs in, and reaches account area",
    { tag: ["@regression"] },
    async ({ accountPage, loginPage, page, registerPage }) => {
      const registrationData = registrationFormDataBuilder.build();

      await applyAllureMetadata({
        ...USER_ONBOARDING_E2E_METADATA,
        story: "Anonymous user onboarding journey",
        severity: "critical",
      });

      await test.step("Open registration page", async () => {
        await registerPage.open();
        await registerPage.waitForReady();
      });

      await test.step("Register a new disposable user through UI", async () => {
        await registerPage.fillRegistrationForm(registrationData);
        await registerPage.submit();
      });

      await test.step("Verify registration redirects to login page", async () => {
        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(loginPage.emailInput).toBeVisible();
      });

      await test.step("Log in with newly registered credentials", async () => {
        await loginPage.waitForReady();
        await loginPage.login(registrationData.email, registrationData.password);
      });

      await test.step("Verify authenticated account area is visible", async () => {
        await accountPage.waitForReady();
        await expect(page).toHaveURL(/\/account$/);
        await expect(accountPage.pageTitle).toHaveText("My account");
      });
    },
  );
});
