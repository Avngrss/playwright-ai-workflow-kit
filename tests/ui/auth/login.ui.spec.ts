import { expect, test } from "../../../src/test/fixtures/test";
import { loginSignupBuilder } from "../../../src/test/data/builders/login-signup.builder";

test.describe("Login and signup entry", () => {
  test(
    "LG-001 renders login and signup sections",
    { tag: ["@ui", "@smoke"] },
    async ({ loginPage }) => {
      await test.step("Open login page", async () => {
        await loginPage.open();
      });

      await test.step("Verify login section controls", async () => {
        await expect(loginPage.loginHeading).toBeVisible();
        await expect(loginPage.loginEmailInput).toBeVisible();
        await expect(loginPage.loginPasswordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();
      });

      await test.step("Verify signup section controls", async () => {
        await expect(loginPage.signupHeading).toBeVisible();
        await expect(loginPage.signupNameInput).toBeVisible();
        await expect(loginPage.signupEmailInput).toBeVisible();
        await expect(loginPage.signupButton).toBeVisible();
      });
    }
  );

  test(
    "LG-002 logs in with valid existing user credentials",
    { tag: ["@ui", "@smoke"] },
    async ({ loginPage, signupAccountInfoPage }) => {
      const signupUser = loginSignupBuilder.buildSignupUser();

      await test.step("Prepare an existing user through UI signup", async () => {
        await loginPage.open();
        await loginPage.fillSignupEntry({
          name: signupUser.name,
          email: signupUser.email,
        });
        await loginPage.submitSignup();

        await expect(signupAccountInfoPage.accountInfoHeading).toBeVisible();
        await signupAccountInfoPage.fillAccountInformation(signupUser);
        await signupAccountInfoPage.submitCreateAccount();

        await expect(signupAccountInfoPage.accountCreatedHeading).toBeVisible();
        await signupAccountInfoPage.continueButton.click();
        await expect(loginPage.loggedInAsLabel).toBeVisible();
        await loginPage.logoutLink.click();
      });

      await test.step("Login with created user credentials", async () => {
        await expect(loginPage.loginHeading).toBeVisible();
        await loginPage.fillLoginForm({
          email: signupUser.email,
          password: signupUser.password,
        });
        await loginPage.submitLogin();
      });

      await test.step("Verify authenticated state", async () => {
        await expect(loginPage.loggedInAsLabel).toBeVisible();
      });
    }
  );

  test(
    "LG-003 navigates to account information from signup entry",
    { tag: ["@ui", "@smoke"] },
    async ({ loginPage, signupAccountInfoPage }) => {
      const signupUser = loginSignupBuilder.buildSignupUser();

      await test.step("Open login page and submit signup entry", async () => {
        await loginPage.open();
        await loginPage.fillSignupEntry({
          name: signupUser.name,
          email: signupUser.email,
        });
        await loginPage.submitSignup();
      });

      await test.step("Verify account information step is shown", async () => {
        await expect(signupAccountInfoPage.accountInfoHeading).toBeVisible();
      });
    }
  );

  test(
    "LG-004 shows error for incorrect login credentials",
    { tag: ["@ui", "@regression"] },
    async ({ loginPage }) => {
      const invalidCredentials = loginSignupBuilder.buildInvalidLoginCredentials();

      await test.step("Open login page and submit incorrect credentials", async () => {
        await loginPage.open();
        await loginPage.fillLoginForm(invalidCredentials);
        await loginPage.submitLogin();
      });

      await test.step("Verify incorrect credentials error message", async () => {
        await expect(loginPage.loginErrorMessage).toBeVisible();
      });
    }
  );

  test(
    "LG-006 blocks login submit when required fields are empty",
    { tag: ["@ui", "@regression"] },
    async ({ loginPage }) => {
      await test.step("Open login page", async () => {
        await loginPage.open();
      });

      await test.step("Attempt login submit with empty required fields", async () => {
        await loginPage.submitLogin();
      });

      await test.step("Verify native required validation blocked submission", async () => {
        const emailIsValid = await loginPage.isLoginEmailValid();
        const passwordIsValid = await loginPage.isLoginPasswordValid();

        expect(emailIsValid).toBe(false);
        expect(passwordIsValid).toBe(false);
        await expect(loginPage.loggedInAsLabel).toBeHidden();
      });
    }
  );
});
