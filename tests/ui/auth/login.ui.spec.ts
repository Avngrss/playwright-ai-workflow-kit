import { expect, test } from "../../../src/test/fixtures/ui.fixture";
import { customerUser, secondaryCustomerUser } from "../../../src/test/data/users";

test.describe("Login flow", () => {
  test.beforeEach(async ({ page, homePage, loginPage }) => {
    await test.step("Open home and navigate to login", async () => {
      await homePage.open();
      await homePage.openLogin();
    });

    await test.step("Verify login page is loaded", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.loginButton).toBeVisible();
    });
  });

  test("happy path login", async ({ page, loginPage, accountPage }) => {
    await test.step("Submit valid customer credentials", async () => {
      await loginPage.login(secondaryCustomerUser.email, secondaryCustomerUser.password);
    });

    await test.step("Verify account page is loaded", async () => {
      await expect(page).toHaveURL(/\/account$/);
      await expect(accountPage.accountHeading).toBeVisible();
      await expect(accountPage.accountMenuButton).toBeVisible();
    });
  });

  test("shows error for valid email and wrong password", async ({ page, loginPage, accountPage }) => {
    await test.step("Submit valid email with wrong password", async () => {
      await loginPage.login(customerUser.email, "WrongPassword123!");
    });

    await test.step("Verify authentication error state", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.loginError).toBeVisible();
      await expect(loginPage.loginError).toContainText(/Invalid email or password|Account locked/i);
      await expect(accountPage.accountMenuButton).not.toBeVisible();
    });
  });

  test("shows error for unknown user credentials", async ({ page, loginPage, accountPage }) => {
    await test.step("Submit unknown user credentials", async () => {
      await loginPage.login("unknown.user@example.com", "SomePassword123!");
    });

    await test.step("Verify authentication error state", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.loginError).toBeVisible();
      await expect(loginPage.loginError).toContainText("Invalid email or password");
      await expect(accountPage.accountMenuButton).not.toBeVisible();
    });
  });

  test("signs out after successful login", async ({ page, loginPage, accountPage }) => {
    await test.step("Login with valid customer credentials", async () => {
      await loginPage.login(secondaryCustomerUser.email, secondaryCustomerUser.password);
      await expect(page).toHaveURL(/\/account$/);
      await expect(accountPage.accountMenuButton).toBeVisible();
    });

    await test.step("Sign out from account menu", async () => {
      await accountPage.signOut();
    });

    await test.step("Verify user is returned to login page", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.loginForm).toBeVisible();
    });
  });

  test("shows required validation when submitting empty login form", async ({ page, loginPage }) => {
    await test.step("Submit login form without entering credentials", async () => {
      await loginPage.submit();
    });

    await test.step("Verify required field validation errors", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.emailError).toBeVisible();
      await expect(loginPage.emailError).toContainText("Email is required");
      await expect(loginPage.passwordError).toBeVisible();
      await expect(loginPage.passwordError).toContainText("Password is required");
    });
  });

  test("shows invalid email format validation", async ({ page, loginPage }) => {
    await test.step("Submit credentials with invalid email format", async () => {
      await loginPage.fillEmail("invalid-email-format");
      await loginPage.fillPassword("SomePassword123!");
      await loginPage.submit();
    });

    await test.step("Verify email format validation error", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.emailError).toBeVisible();
      await expect(loginPage.emailError).toContainText("Email format is invalid");
    });
  });

  test("shows required password validation when password is missing", async ({ page, loginPage }) => {
    await test.step("Submit form with valid email and empty password", async () => {
      await loginPage.fillEmail(customerUser.email);
      await loginPage.submit();
    });

    await test.step("Verify password required validation error", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.passwordError).toBeVisible();
      await expect(loginPage.passwordError).toContainText("Password is required");
    });
  });

  test("shows required email validation when email is missing", async ({ page, loginPage }) => {
    await test.step("Submit form with empty email and non-empty password", async () => {
      await loginPage.fillPassword("SomePassword123!");
      await loginPage.submit();
    });

    await test.step("Verify email required validation error", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.emailError).toBeVisible();
      await expect(loginPage.emailError).toContainText("Email is required");
    });
  });

  test("navigates to register page from login", async ({ page, loginPage }) => {
    await test.step("Click register link on login page", async () => {
      await loginPage.openRegister();
    });

    await test.step("Verify register page URL", async () => {
      await expect(page).toHaveURL(/\/auth\/register$/);
    });
  });

  test("navigates to forgot password page from login", async ({ page, loginPage }) => {
    await test.step("Click forgot password link on login page", async () => {
      await loginPage.openForgotPassword();
    });

    await test.step("Verify forgot password page URL", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password$/);
    });
  });
});
