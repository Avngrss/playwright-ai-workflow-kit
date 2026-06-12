import { base, expect } from "./base.fixture";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";

type PageFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
};

const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
});

export { test, expect };
