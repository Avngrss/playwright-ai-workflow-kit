import { Locator, Page } from "@playwright/test";
import { SignupAccountInfoData } from "../data/types/login-signup.type";

export class SignupAccountInfoPage {
  readonly page: Page;
  readonly accountInfoHeading: Locator;
  readonly passwordInput: Locator;
  readonly daySelect: Locator;
  readonly monthSelect: Locator;
  readonly yearSelect: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly countrySelect: Locator;
  readonly stateInput: Locator;
  readonly cityInput: Locator;
  readonly zipcodeInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly createAccountButton: Locator;
  readonly accountCreatedHeading: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountInfoHeading = page.getByRole("heading", {
      name: /enter account information/i,
    });
    this.passwordInput = page.getByTestId("password");
    this.daySelect = page.getByTestId("days");
    this.monthSelect = page.getByTestId("months");
    this.yearSelect = page.getByTestId("years");
    this.firstNameInput = page.getByTestId("first_name");
    this.lastNameInput = page.getByTestId("last_name");
    this.addressInput = page.getByTestId("address");
    this.countrySelect = page.getByTestId("country");
    this.stateInput = page.getByTestId("state");
    this.cityInput = page.getByTestId("city");
    this.zipcodeInput = page.getByTestId("zipcode");
    this.mobileNumberInput = page.getByTestId("mobile_number");
    this.createAccountButton = page.getByTestId("create-account");
    this.accountCreatedHeading = page.getByRole("heading", { name: /account created!/i });
    this.continueButton = page.getByTestId("continue-button");
  }

  async fillAccountInformation(data: SignupAccountInfoData): Promise<void> {
    await this.passwordInput.fill(data.password);
    await this.daySelect.selectOption(data.day);
    await this.monthSelect.selectOption(data.month);
    await this.yearSelect.selectOption(data.year);
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.addressInput.fill(data.address);
    await this.countrySelect.selectOption(data.country);
    await this.stateInput.fill(data.state);
    await this.cityInput.fill(data.city);
    await this.zipcodeInput.fill(data.zipcode);
    await this.mobileNumberInput.fill(data.mobileNumber);
  }

  async submitCreateAccount(): Promise<void> {
    await this.createAccountButton.click();
  }
}
