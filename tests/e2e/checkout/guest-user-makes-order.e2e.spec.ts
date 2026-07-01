import { generateUniqueEmail } from "../../../src/test/data/generators/unique-email.generator";
import { expect, test } from "../../../src/test/fixtures/test";
import { applyAllureMetadata } from "../../../src/test/reporting/allure-metadata.helper";

const GUEST_ORDER_E2E_METADATA = {
  parentSuite: "E2E",
  suite: "Checkout",
  feature: "Guest order flow",
  owner: "qa",
} as const;

const BILLING_LOOKUP_ADDRESS = {
  country: "Netherlands (the)",
  postalCode: "1234AA",
  houseNumber: "42",
} as const;

test.describe("Guest user order E2E", { tag: ["@e2e"] }, () => {
  test(
    "guest user completes checkout and sees invoice confirmation",
    { tag: ["@regression"] },
    async ({ checkoutPage, page, productsPage }) => {
      const guestEmail = generateUniqueEmail("guest.order");

      await applyAllureMetadata({
        ...GUEST_ORDER_E2E_METADATA,
        story: "Guest user makes order with cash on delivery",
        severity: "critical",
      });

      await test.step("Open storefront and ensure catalog is ready", async () => {
        await productsPage.open();
        await productsPage.waitForReady();
        await expect(page).toHaveURL(/\/$/);
      });

      await test.step("Add first visible in-stock product to cart", async () => {
        const productName = await productsPage.getFirstInStockProductName();
        expect(productName.length).toBeGreaterThan(0);

        await productsPage.addFirstInStockProductToCart();
        await expect(productsPage.cartAddedAlert).toBeVisible();
        await expect(productsPage.cartLink).toBeVisible();
      });

      await test.step("Open cart checkout step from header and proceed", async () => {
        await expect(productsPage.cartLink).toBeVisible();
        await productsPage.openCart();
        await checkoutPage.waitForCartStepReady();

        await expect(checkoutPage.cartTotal).toBeVisible();
        await expect(checkoutPage.proceedFromCartButton).toBeEnabled();
        await checkoutPage.proceedFromCart();
      });

      await test.step("Continue as guest with generated identity", async () => {
        await checkoutPage.openGuestCheckoutTab();
        await checkoutPage.fillGuestIdentity({
          email: guestEmail,
          firstName: "Guest",
          lastName: "Buyer",
        });
        await checkoutPage.submitGuestIdentity();

        await expect(checkoutPage.proceedAsGuestButton).toBeVisible();
        await checkoutPage.continueAsGuest();
      });

      await test.step("Fill deterministic billing lookup data and proceed to payment", async () => {
        await checkoutPage.fillBillingLookupAddress(BILLING_LOOKUP_ADDRESS);

        await expect(checkoutPage.streetInput).toHaveValue(/.+/);
        await expect(checkoutPage.cityInput).toHaveValue(/.+/);
        await expect(checkoutPage.stateInput).toHaveValue(/.+/);

        await checkoutPage.proceedFromBillingAddress();
      });

      await test.step("Use cash on delivery and place the order", async () => {
        await checkoutPage.selectPaymentMethod("cash-on-delivery");
        await expect(checkoutPage.paymentMethodSelect).toHaveValue("cash-on-delivery");
        await expect(checkoutPage.finishOrderButton).toBeEnabled();
        await checkoutPage.placeOrder();
        await expect(checkoutPage.paymentSuccessMessage).toBeVisible();
        await expect(checkoutPage.confirmOrderButton).toBeVisible();
      });

      await test.step("Verify order confirmation contains generated invoice number", async () => {
        await expect(checkoutPage.confirmOrderButton).toBeEnabled();
        await checkoutPage.confirmOrder();
        await expect(checkoutPage.orderConfirmation).toBeVisible();

        const confirmationText = await checkoutPage.getOrderConfirmationText();
        expect(confirmationText).toMatch(
          /^Thanks for your order! Your invoice number is INV-\d+\.$/,
        );
      });
    },
  );
});
