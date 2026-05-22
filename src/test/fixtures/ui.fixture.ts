import { expect, test as base } from "@playwright/test";
import { AccountPage } from "../pages/AccountPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";

type UiFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  accountPage: AccountPage;
  forgotPasswordPage: ForgotPasswordPage;
};

export const test = base.extend<UiFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },
});

export { expect };
