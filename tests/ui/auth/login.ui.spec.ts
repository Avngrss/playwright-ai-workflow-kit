import { expect, test } from "@playwright/test";
import { AccountPage } from "../../pages/AccountPage";
import { HomePage } from "../../pages/HomePage";
import { LoginPage } from "../../pages/LoginPage";
import { customerUser } from "../../../src/test/data/users";

test.describe("Login flow", () => {
  test("happy path login", async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);
    const accountPage = new AccountPage(page);

    await test.step("Open home and navigate to login", async () => {
      await homePage.open();
      await homePage.openLogin();
    });

    await test.step("Verify login page is loaded", async () => {
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.loginButton).toBeVisible();
    });

    await test.step("Submit valid customer credentials", async () => {
      await loginPage.login(customerUser.email, customerUser.password);
    });

    await test.step("Verify account page is loaded", async () => {
      await expect(page).toHaveURL(/\/account$/);
      await expect(accountPage.accountHeading).toBeVisible();
      await expect(accountPage.accountMenuButton).toBeVisible();
    });
  });
});
