import { expect, test } from "../../src/test/fixtures/test";
import { createUniqueEmail } from "../../src/test/data/generators/email.generator";
import type { RegisterFormData } from "../../src/test/data/types/register-form-data.type";
import { applyAllureMetadata } from "../../src/test/reporting/allure-metadata.helper";

const baseRegistrationData: Omit<RegisterFormData, "email" | "dateOfBirth" | "password"> = {
  firstName: "Jane",
  lastName: "Doe",
  country: "Netherlands (the)",
  postalCode: "1234AA",
  houseNumber: "12",
  street: "Main Street",
  city: "Amsterdam",
  state: "Noord-Holland",
  phone: "1234567890",
};

function createValidRegistrationData(email: string): RegisterFormData {
  return {
    ...baseRegistrationData,
    dateOfBirth: "1990-01-01",
    email,
    password: "ValidPass@123",
  };
}

test.describe("Registration UI", { tag: ["@ui", "@register"] }, () => {
  const commonMetadata = {
    feature: "Registration",
    suite: "Registration UI",
    owner: "qa",
    layer: "ui" as const,
    tags: ["registration"],
  };

  test.beforeEach(async ({ registerPage }) => {
    await applyAllureMetadata(commonMetadata);
    await registerPage.open();
    await expect(registerPage.heading).toBeVisible();
  });

  test("shows registration form controls", { tag: ["@smoke"] }, async ({ registerPage }) => {
    await applyAllureMetadata({
      story: "Registration form availability",
      severity: "CRITICAL",
    });

    await test.step("Verify required registration controls are visible", async () => {
      await expect(registerPage.firstNameInput).toBeVisible();
      await expect(registerPage.lastNameInput).toBeVisible();
      await expect(registerPage.dateOfBirthInput).toBeVisible();
      await expect(registerPage.countrySelect).toBeVisible();
      await expect(registerPage.postalCodeInput).toBeVisible();
      await expect(registerPage.houseNumberInput).toBeVisible();
      await expect(registerPage.streetInput).toBeVisible();
      await expect(registerPage.cityInput).toBeVisible();
      await expect(registerPage.stateInput).toBeVisible();
      await expect(registerPage.phoneInput).toBeVisible();
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.passwordInput).toBeVisible();
      await expect(registerPage.registerButton).toBeVisible();
    });
  });

  test("submits valid registration form and opens login page", { tag: ["@smoke"] }, async ({ registerPage, loginPage }) => {
    await applyAllureMetadata({
      story: "Successful customer registration",
      severity: "BLOCKER",
    });

    const registrationData = createValidRegistrationData(
      createUniqueEmail("register-ui-happy"),
    );

    await test.step("Fill registration form with valid data and submit", async () => {
      await registerPage.fillRegistrationForm(registrationData);
      await registerPage.submit();
    });

    await test.step("Verify user reaches the login page after successful registration", async () => {
      await expect(registerPage.page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.heading).toBeVisible();
    });
  });

  test("shows required field validation on empty submit", { tag: ["@regression"] }, async ({ registerPage }) => {
    await applyAllureMetadata({
      story: "Required field validation feedback",
      severity: "NORMAL",
    });

    await test.step("Submit registration form without filling required data", async () => {
      await registerPage.submit();
    });

    await test.step("Verify required validation feedback is visible", async () => {
      await expect(registerPage.firstNameRequiredError).toBeVisible();
      await expect(registerPage.lastNameRequiredError).toBeVisible();
      await expect(registerPage.dateOfBirthRequiredError).toBeVisible();
      await expect(registerPage.countryRequiredError).toBeVisible();
      await expect(registerPage.postalCodeRequiredError).toBeVisible();
      await expect(registerPage.houseNumberRequiredError).toBeVisible();
      await expect(registerPage.streetRequiredError).toBeVisible();
      await expect(registerPage.cityRequiredError).toBeVisible();
      await expect(registerPage.stateRequiredError).toBeVisible();
      await expect(registerPage.phoneRequiredError).toBeVisible();
      await expect(registerPage.emailRequiredError).toBeVisible();
      await expect(registerPage.passwordRequiredError).toBeVisible();
    });
  });

  test("shows date format validation for invalid date of birth", { tag: ["@regression"] }, async ({ registerPage }) => {
    await applyAllureMetadata({
      story: "Date of birth format validation",
      severity: "NORMAL",
    });

    const invalidDobData: RegisterFormData = {
      ...baseRegistrationData,
      dateOfBirth: "1990/01/01",
      email: createUniqueEmail("register-ui-invalid-dob"),
      password: "welcome01",
    };

    await test.step("Fill registration form with invalid date format and submit", async () => {
      await registerPage.fillRegistrationForm(invalidDobData);
      await registerPage.submit();
    });

    await test.step("Verify date format error is shown", async () => {
      await expect(registerPage.dateOfBirthFormatError).toBeVisible();
    });
  });

  test("shows password policy guidance and invalid password state", { tag: ["@regression"] }, async ({ registerPage }) => {
    await applyAllureMetadata({
      story: "Password policy feedback",
      severity: "NORMAL",
    });

    const invalidPasswordData: RegisterFormData = {
      ...baseRegistrationData,
      dateOfBirth: "1990-01-01",
      email: createUniqueEmail("register-ui-invalid-password"),
      password: "",
    };

    await test.step("Verify password policy helper text", async () => {
      await expect(registerPage.passwordPolicyMinimumLengthText).toBeVisible();
      await expect(registerPage.passwordPolicyLetterCaseText).toBeVisible();
      await expect(registerPage.passwordPolicyNumberText).toBeVisible();
      await expect(registerPage.passwordPolicySpecialCharText).toBeVisible();
    });

    await test.step("Submit form with an empty password", async () => {
      await registerPage.fillRegistrationForm(invalidPasswordData);
      await registerPage.submit();
    });

    await test.step("Verify invalid password feedback is visible", async () => {
      await expect(registerPage.passwordRequiredError).toBeVisible();
      await expect(registerPage.passwordMinLengthError).toBeVisible();
      await expect(registerPage.passwordInvalidCharactersError).toBeVisible();
    });
  });

  test("autofills address fields from postcode lookup", { tag: ["@regression"] }, async ({ registerPage }) => {
    await applyAllureMetadata({
      story: "Address autofill from postcode",
      severity: "NORMAL",
    });

    await test.step("Provide country, postcode, and house number", async () => {
      await registerPage.fillPostcodeLookupInputs({
        country: "Netherlands (the)",
        postalCode: "1234AA",
        houseNumber: "12",
      });
    });

    await test.step("Verify street, city, and state are auto-filled", async () => {
      await expect(registerPage.streetInput).toHaveValue(/\S+/);
      await expect(registerPage.cityInput).toHaveValue(/\S+/);
      await expect(registerPage.stateInput).toHaveValue(/\S+/);
    });
  });

  test("shows duplicate email conflict feedback", { tag: ["@regression"] }, async ({ registerPage, loginPage }) => {
    await applyAllureMetadata({
      story: "Duplicate email conflict feedback",
      severity: "CRITICAL",
    });

    const duplicateEmail = createUniqueEmail("register-ui-duplicate");
    const firstRegistrationData = createValidRegistrationData(duplicateEmail);
    const duplicateRegistrationData = createValidRegistrationData(duplicateEmail);

    await test.step("Create an existing user via initial registration setup", async () => {
      await registerPage.fillRegistrationForm(firstRegistrationData);
      await registerPage.submit();
      await expect(registerPage.page).toHaveURL(/\/auth\/login$/);
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Submit registration with the same email again", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
      await registerPage.fillRegistrationForm(duplicateRegistrationData);
      await registerPage.submit();
    });

    await test.step("Verify duplicate email conflict is shown to the user", async () => {
      await expect(registerPage.duplicateEmailConflictAlert).toBeVisible();
      await expect(registerPage.page).toHaveURL(/\/auth\/register$/);
    });
  });
});
