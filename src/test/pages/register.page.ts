import type { Locator, Page } from "@playwright/test";
import type { RegistrationFormData } from "../data/types/registration-form-data.type";

export class RegisterPage {
  readonly registrationForm: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly dateOfBirthInput: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly houseNumberInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  readonly firstNameRequiredError: Locator;
  readonly lastNameRequiredError: Locator;
  readonly countryRequiredError: Locator;
  readonly emailRequiredError: Locator;
  readonly passwordRequiredError: Locator;
  readonly duplicateEmailError: Locator;

  constructor(private readonly page: Page) {
    this.registrationForm = page.locator("form");
    this.firstNameInput = page.getByTestId("first-name");
    this.lastNameInput = page.getByTestId("last-name");
    this.dateOfBirthInput = page.getByTestId("dob");
    this.countrySelect = page.getByTestId("country");
    this.postalCodeInput = page.getByTestId("postal_code");
    this.houseNumberInput = page.getByTestId("house_number");
    this.streetInput = page.getByTestId("street");
    this.cityInput = page.getByTestId("city");
    this.stateInput = page.getByTestId("state");
    this.phoneInput = page.getByTestId("phone");
    this.emailInput = page.getByTestId("email");
    this.passwordInput = page.getByTestId("password");
    this.submitButton = page.getByTestId("register-submit");

    this.firstNameRequiredError = page.getByText("First name is required");
    this.lastNameRequiredError = page.getByText("Last name is required");
    this.countryRequiredError = page.getByText("Country is required");
    this.emailRequiredError = page.getByText("Email is required");
    this.passwordRequiredError = page.getByText("Password is required");
    this.duplicateEmailError = page.getByText(/already exists/i);
  }

  async open(): Promise<void> {
    await this.page.goto("/auth/register", { waitUntil: "domcontentloaded" });
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForURL(/\/auth\/register$/);
    await this.registrationForm.waitFor({ state: "visible", timeout: 20000 });
    await this.firstNameInput.waitFor({ state: "visible", timeout: 20000 });
    await this.submitButton.waitFor({ state: "visible", timeout: 20000 });
  }

  async fillRegistrationForm(data: RegistrationFormData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.dateOfBirthInput.fill(data.dateOfBirth);
    await this.countrySelect.selectOption({ label: data.country });
    await this.postalCodeInput.fill(data.postalCode);
    await this.houseNumberInput.fill(data.houseNumber);
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.phoneInput.fill(data.phone);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
