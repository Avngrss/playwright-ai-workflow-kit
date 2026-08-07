import type { Locator, Page } from "@playwright/test";

import type { RegisterFormData } from "../data/types/register-form-data.type";

export class RegisterPage {
  readonly page: Page;
  readonly heading: Locator;
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
  readonly registerButton: Locator;
  readonly passwordPolicyMinimumLengthText: Locator;
  readonly passwordPolicyLetterCaseText: Locator;
  readonly passwordPolicyNumberText: Locator;
  readonly passwordPolicySpecialCharText: Locator;
  readonly firstNameRequiredError: Locator;
  readonly lastNameRequiredError: Locator;
  readonly dateOfBirthFormatError: Locator;
  readonly dateOfBirthRequiredError: Locator;
  readonly countryRequiredError: Locator;
  readonly postalCodeRequiredError: Locator;
  readonly houseNumberRequiredError: Locator;
  readonly streetRequiredError: Locator;
  readonly cityRequiredError: Locator;
  readonly stateRequiredError: Locator;
  readonly phoneRequiredError: Locator;
  readonly emailRequiredError: Locator;
  readonly passwordRequiredError: Locator;
  readonly passwordMinLengthError: Locator;
  readonly passwordInvalidCharactersError: Locator;
  readonly duplicateEmailConflictAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Customer registration" });
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
    this.registerButton = page.getByTestId("register-submit");

    this.passwordPolicyMinimumLengthText = page.getByText(
      "Be at least 8 characters long",
    );
    this.passwordPolicyLetterCaseText = page.getByText(
      "Contain both uppercase and lowercase letters",
    );
    this.passwordPolicyNumberText = page.getByText("Include at least one number");
    this.passwordPolicySpecialCharText = page.getByText(
      "Have at least one special symbol (e.g., @, #, $, etc.)",
    );

    this.firstNameRequiredError = page.getByText("First name is required");
    this.lastNameRequiredError = page.getByText("Last name is required");
    this.dateOfBirthFormatError = page.getByText(
      "Please enter a valid date in YYYY-MM-DD format.",
    );
    this.dateOfBirthRequiredError = page.getByText("Date of Birth is required");
    this.countryRequiredError = page.getByText("Country is required");
    this.postalCodeRequiredError = page.getByText("Postcode is required");
    this.houseNumberRequiredError = page.getByText("House number is required");
    this.streetRequiredError = page.getByText("Street is required");
    this.cityRequiredError = page.getByText("City is required");
    this.stateRequiredError = page.getByText("State is required");
    this.phoneRequiredError = page.getByText(/Phone is required\.?/);
    this.emailRequiredError = page.getByText("Email is required");
    this.passwordRequiredError = page.getByText("Password is required");
    this.passwordMinLengthError = page.getByText(
      "Password must be minimal 6 characters long.",
    );
    this.passwordInvalidCharactersError = page.getByText(
      "Password can not include invalid characters.",
    );
    this.duplicateEmailConflictAlert = page.getByText(
      "A customer with this email address already exists.",
    );
  }

  async open(): Promise<void> {
    await this.page.goto("/auth/register");
  }

  async submit(): Promise<void> {
    await this.registerButton.click();
  }

  async fillRegistrationForm(data: RegisterFormData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.dateOfBirthInput.fill(data.dateOfBirth);
    await this.countrySelect.selectOption(data.country);
    await this.postalCodeInput.fill(data.postalCode);
    await this.houseNumberInput.fill(data.houseNumber);
    await this.streetInput.fill(data.street);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.phoneInput.fill(data.phone);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
  }

  async fillPostcodeLookupInputs(data: {
    country: string;
    postalCode: string;
    houseNumber: string;
  }): Promise<void> {
    await this.countrySelect.selectOption(data.country);
    await this.postalCodeInput.fill(data.postalCode);
    await this.houseNumberInput.fill(data.houseNumber);
  }
}
