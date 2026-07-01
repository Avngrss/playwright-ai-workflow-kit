import { test as base, expect } from "./api-preconditions.fixture";
import { AccountPage } from "../pages/account.page";
import { CheckoutPage } from "../pages/checkout.page";
import { ContactPage } from "../pages/contact.page";
import { ForgotPasswordPage } from "../pages/forgot-password.page";
import { LoginPage } from "../pages/login.page";
import { ProductsPage } from "../pages/products.page";
import { RegisterPage } from "../pages/register.page";

type PageFixtures = {
  accountPage: AccountPage;
  checkoutPage: CheckoutPage;
  contactPage: ContactPage;
  forgotPasswordPage: ForgotPasswordPage;
  loginPage: LoginPage;
  productsPage: ProductsPage;
  registerPage: RegisterPage;
};

const test = base.extend<PageFixtures>({
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
});

export { test, expect };
