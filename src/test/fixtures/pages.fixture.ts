import { base, expect } from "./base.fixture";
import { AccountPage } from "../pages/account.page";
import { ContactPage } from "../pages/contact.page";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";

type PageFixtures = {
  accountPage: AccountPage;
  contactPage: ContactPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
};

const test = base.extend<PageFixtures>({
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
});

export { test, expect };
