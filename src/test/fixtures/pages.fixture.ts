import { test as apiTest, expect } from "./api.fixture";
import { AccountPage } from "../pages/account.page";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";

type PageFixtures = {
  accountPage: AccountPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
};

export const test = apiTest.extend<PageFixtures>({
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
});

export { expect };
