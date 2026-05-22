import { expect, test } from "../../../src/test/fixtures/ui.fixture";
import { customerUser } from "../../../src/test/data/users";

test.describe("Forgot password page", () => {
  test.beforeEach(async ({ page, homePage, loginPage, forgotPasswordPage }) => {
    await test.step("Open home and navigate to forgot password page", async () => {
      await homePage.open();
      await homePage.openLogin();
      await loginPage.openForgotPassword();
    });

    await test.step("Verify forgot password page is loaded", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password$/);
      await expect(forgotPasswordPage.forgotPasswordForm).toBeVisible();
      await expect(forgotPasswordPage.submitButton).toBeVisible();
    });
  });

  test("requests password reset with registered email", async ({ page, forgotPasswordPage }) => {
    await test.step("Submit forgot password form with registered email", async () => {
      await forgotPasswordPage.requestReset(customerUser.email);
    });

    await test.step("Verify success alert is shown", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password$/);
      await expect(forgotPasswordPage.feedbackAlert).toHaveCount(1);
      await expect(forgotPasswordPage.feedbackAlert).toContainText("page.forgot-password.confirm");
      await expect(forgotPasswordPage.emailError).toBeHidden();
    });
  });

  test("accepts registered email with leading and trailing spaces", async ({ forgotPasswordPage }) => {
    await test.step("Submit forgot password request with padded email", async () => {
      await forgotPasswordPage.requestReset(`  ${customerUser.email}  `);
    });

    await test.step("Verify email is normalized and request succeeds", async () => {
      await expect(forgotPasswordPage.feedbackAlert).toHaveCount(1);
      await expect(forgotPasswordPage.feedbackAlert).toContainText("page.forgot-password.confirm");
      await expect(await forgotPasswordPage.getEmailValue()).toBe(customerUser.email);
    });
  });

  test("shows backend error for unknown email", async ({ page, forgotPasswordPage }) => {
    await test.step("Submit forgot password request with unknown email", async () => {
      await forgotPasswordPage.requestReset("unknown.user@example.com");
    });

    await test.step("Verify backend validation message", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password$/);
      await expect(forgotPasswordPage.feedbackAlert).toHaveCount(1);
      await expect(forgotPasswordPage.feedbackAlert).toContainText("The selected email is invalid.");
      await expect(page).not.toHaveURL(/\/account$/);
    });
  });

  test("shows required validation when email is empty", async ({ page, forgotPasswordPage }) => {
    await test.step("Submit without entering email", async () => {
      await forgotPasswordPage.submit();
    });

    await test.step("Verify required email error", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password$/);
      await expect(forgotPasswordPage.emailError).toBeVisible();
      await expect(forgotPasswordPage.emailError).toContainText("Email is required");
      await expect(forgotPasswordPage.feedbackAlert).toHaveCount(0);
    });
  });

  test("shows required validation when email contains only spaces", async ({ forgotPasswordPage }) => {
    await test.step("Submit with spaces-only email", async () => {
      await forgotPasswordPage.requestReset("   ");
    });

    await test.step("Verify required email error", async () => {
      await expect(forgotPasswordPage.emailError).toBeVisible();
      await expect(forgotPasswordPage.emailError).toContainText("Email is required");
      await expect(forgotPasswordPage.feedbackAlert).toHaveCount(0);
    });
  });

  test("blocks invalid email format with native validation", async ({ page, forgotPasswordPage }) => {
    await test.step("Submit malformed email address", async () => {
      await forgotPasswordPage.requestReset("invalid-email");
    });

    await test.step("Verify native email validation blocks submit", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password$/);
      await expect(forgotPasswordPage.feedbackAlert).toHaveCount(0);
      await expect(await forgotPasswordPage.getEmailValidationMessage()).toContain("@");
    });
  });

  test("does not duplicate alert after submitting valid request twice", async ({ forgotPasswordPage }) => {
    await test.step("Submit forgot password form twice with registered email", async () => {
      await forgotPasswordPage.requestReset(customerUser.email);
      await forgotPasswordPage.submit();
    });

    await test.step("Verify only one feedback alert is displayed", async () => {
      await expect(forgotPasswordPage.feedbackAlert).toHaveCount(1);
      await expect(forgotPasswordPage.feedbackAlert).toContainText("page.forgot-password.confirm");
    });
  });
});

test.describe("Forgot password navigation", () => {
  test.beforeEach(async ({ homePage }) => {
    await test.step("Open home page and navigate to login", async () => {
      await homePage.open();
      await homePage.openLogin();
    });
  });

  test("opens forgot password page from login screen", async ({ page, loginPage, forgotPasswordPage }) => {
    await test.step("Navigate from login to forgot password", async () => {
      await loginPage.openForgotPassword();
    });

    await test.step("Verify forgot password page URL and form", async () => {
      await expect(page).toHaveURL(/\/auth\/forgot-password$/);
      await expect(forgotPasswordPage.forgotPasswordForm).toBeVisible();
    });
  });
});
