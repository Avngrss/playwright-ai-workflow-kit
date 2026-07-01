import type { Locator, Page } from "@playwright/test";

export type GuestCheckoutIdentity = {
  email: string;
  firstName: string;
  lastName: string;
};

export type BillingLookupAddress = {
  country: string;
  postalCode: string;
  houseNumber: string;
};

export class CheckoutPage {
  readonly cartTotal: Locator;
  readonly proceedFromCartButton: Locator;
  readonly guestTab: Locator;
  readonly guestEmailInput: Locator;
  readonly guestFirstNameInput: Locator;
  readonly guestLastNameInput: Locator;
  readonly guestSubmitButton: Locator;
  readonly proceedAsGuestButton: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly houseNumberInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly proceedFromBillingButton: Locator;
  readonly paymentMethodSelect: Locator;
  readonly finishOrderButton: Locator;
  readonly confirmOrderButton: Locator;
  readonly paymentSuccessMessage: Locator;
  readonly orderConfirmation: Locator;

  constructor(private readonly page: Page) {
    this.cartTotal = page.getByTestId("cart-total");
    this.proceedFromCartButton = page.getByTestId("proceed-1");
    this.guestTab = page
      .getByRole("tab", { name: /guest/i })
      .or(page.getByRole("button", { name: /guest/i }));
    this.guestEmailInput = page.getByTestId("guest-email");
    this.guestFirstNameInput = page.getByTestId("guest-first-name");
    this.guestLastNameInput = page.getByTestId("guest-last-name");
    this.guestSubmitButton = page.getByTestId("guest-submit");
    this.proceedAsGuestButton = page.getByTestId("proceed-2-guest");
    this.countrySelect = page.getByTestId("country");
    this.postalCodeInput = page.getByTestId("postal_code");
    this.houseNumberInput = page.getByTestId("house_number");
    this.streetInput = page.getByTestId("street");
    this.cityInput = page.getByTestId("city");
    this.stateInput = page.getByTestId("state");
    this.proceedFromBillingButton = page.getByTestId("proceed-3");
    this.paymentMethodSelect = page.getByTestId("payment-method");
    this.finishOrderButton = page.getByTestId("finish");
    this.confirmOrderButton = page.getByRole("button", { name: /^confirm$/i });
    this.paymentSuccessMessage = page.getByText("Payment was successful");
    this.orderConfirmation = page
      .locator("#order-confirmation")
      .or(page.getByText(/Thanks for your order! Your invoice number is/i));
  }

  async waitForCartStepReady(): Promise<void> {
    await this.page.waitForURL(/\/checkout$/);
    await this.cartTotal.waitFor({ state: "visible", timeout: 20000 });
    await this.proceedFromCartButton.waitFor({ state: "visible", timeout: 20000 });
  }

  async proceedFromCart(): Promise<void> {
    await this.proceedFromCartButton.click();
  }

  async openGuestCheckoutTab(): Promise<void> {
    if (await this.guestTab.isVisible().catch(() => false)) {
      await this.guestTab.click();
    }
  }

  async fillGuestIdentity(identity: GuestCheckoutIdentity): Promise<void> {
    await this.guestEmailInput.fill(identity.email);
    await this.guestFirstNameInput.fill(identity.firstName);
    await this.guestLastNameInput.fill(identity.lastName);
  }

  async submitGuestIdentity(): Promise<void> {
    await this.guestSubmitButton.click();
  }

  async continueAsGuest(): Promise<void> {
    await this.proceedAsGuestButton.click();
  }

  async fillBillingLookupAddress(address: BillingLookupAddress): Promise<void> {
    await this.countrySelect.selectOption({ label: address.country });
    await this.postalCodeInput.fill(address.postalCode);
    await this.houseNumberInput.fill(address.houseNumber);
  }

  async proceedFromBillingAddress(): Promise<void> {
    await this.proceedFromBillingButton.click();
  }

  async selectPaymentMethod(value: string): Promise<void> {
    await this.paymentMethodSelect.selectOption(value);
  }

  async placeOrder(): Promise<void> {
    await this.finishOrderButton.waitFor({ state: "visible", timeout: 20000 });

    const paymentCheckResponse = this.page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/payment/check"),
      { timeout: 20000 },
    );

    await this.finishOrderButton.click();
    await paymentCheckResponse;
    await this.paymentSuccessMessage.waitFor({ state: "visible", timeout: 20000 });
    await this.confirmOrderButton.waitFor({ state: "visible", timeout: 20000 });
  }

  async confirmOrder(): Promise<void> {
    await this.confirmOrderButton.waitFor({ state: "visible", timeout: 20000 });
    await this.paymentSuccessMessage.waitFor({ state: "visible", timeout: 20000 });

    const dialogAcceptance = this.page
      .waitForEvent("dialog", { timeout: 5000 })
      .then((dialog) => dialog.accept())
      .catch(() => undefined);

    await this.confirmOrderButton.click();
    await dialogAcceptance;
    await this.orderConfirmation.waitFor({ state: "visible", timeout: 20000 });
  }

  async getOrderConfirmationText(): Promise<string> {
    const text = (await this.orderConfirmation.textContent()) ?? "";
    return text.replace(/\s+/g, " ").trim();
  }
}
