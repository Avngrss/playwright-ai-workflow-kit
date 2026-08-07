import { expect, test } from "../../src/test/fixtures/test";
import { createUniqueEmail } from "../../src/test/data/generators/email.generator";
import { applyAllureMetadata } from "../../src/test/reporting/allure-metadata.helper";
import {
  createDisposableUserCredentials,
  defaultAuthPassword,
  registerDisposableUser,
} from "../../src/test/setup/auth/disposable-user.setup";

test.describe("Login UI", { tag: ["@ui", "@login"] }, () => {
  const commonMetadata = {
    feature: "Login",
    suite: "Login UI",
    owner: "qa",
    layer: "ui" as const,
    tags: ["login"],
  };

  test.beforeEach(async ({ loginPage }) => {
    await applyAllureMetadata(commonMetadata);
    await loginPage.open();
    await expect(loginPage.heading).toBeVisible();
  });

  test(
    "shows login form controls and auth navigation links",
    { tag: ["@smoke"] },
    async ({ loginPage }) => {
      await applyAllureMetadata({
        story: "Login form availability",
        severity: "CRITICAL",
      });

      await test.step("Verify required login controls are visible", async () => {
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();
      });

      await test.step("Verify auth-related navigation links are visible", async () => {
        await expect(loginPage.registerAccountLink).toBeVisible();
        await expect(loginPage.forgotPasswordLink).toBeVisible();
      });
    },
  );

  test(
    "signs in with a disposable user and opens account overview",
    { tag: ["@smoke"] },
    async ({ apiSetupRequest, loginPage, accountPage }) => {
      await applyAllureMetadata({
        story: "Successful login flow",
        severity: "BLOCKER",
      });

      const credentials = createDisposableUserCredentials("login-ui-happy");

      await test.step("Create a disposable user precondition through API", async () => {
        await registerDisposableUser(apiSetupRequest, credentials);
      });

      await test.step("Submit valid credentials in the login form", async () => {
        await loginPage.fillCredentials(credentials);
        await loginPage.submit();
      });

      await test.step("Verify user reaches authenticated account area", async () => {
        await expect(loginPage.page).toHaveURL(/\/account$/);
        await expect(accountPage.heading).toBeVisible();
      });
    },
  );

  test(
    "shows error feedback for invalid credentials",
    { tag: ["@regression"] },
    async ({ loginPage }) => {
      await applyAllureMetadata({
        story: "Invalid credential feedback",
        severity: "NORMAL",
      });

      await test.step("Submit login form with invalid credentials", async () => {
        await loginPage.fillCredentials({
          email: createUniqueEmail("login-ui-invalid"),
          password: "WrongPass@123",
        });
        await loginPage.submit();
      });

      await test.step("Verify invalid login feedback remains visible on login page", async () => {
        await expect(loginPage.invalidCredentialsError).toBeVisible();
        await expect(loginPage.page).toHaveURL(/\/auth\/login$/);
      });
    },
  );
});
