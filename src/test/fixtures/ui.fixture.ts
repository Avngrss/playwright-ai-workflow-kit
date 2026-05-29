import { expect, test as base } from "./base.fixture";
import { ContactUsPage } from "../pages/contact-us.page";
import { HomePage } from "../pages/home.page";
import { LoginPage } from "../pages/login.page";
import { SignupAccountInfoPage } from "../pages/signup-account-info.page";

type UiFixtures = {
  contactUsPage: ContactUsPage;
  homePage: HomePage;
  loginPage: LoginPage;
  signupAccountInfoPage: SignupAccountInfoPage;
};

const test = base.extend<UiFixtures>({
  contactUsPage: async ({ page }, use) => {
    await use(new ContactUsPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signupAccountInfoPage: async ({ page }, use) => {
    await use(new SignupAccountInfoPage(page));
  },
});

export { test, expect };
